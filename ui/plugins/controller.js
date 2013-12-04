"use strict";


treeherder.controller('PluginCtrl',
    function PluginCtrl($scope, $rootScope, $resource, $http,
                                 thServiceDomain, thUrl, thJobNote, thStarTypes, $log) {

        var JobNote = null;

        $scope.$watch('selectedJob', function(newValue, oldValue) {
            // preferred way to get access to the selected job
            if (newValue) {
                $scope.job = newValue;
                $scope.artifacts = {};

                var undef = "---undefined---";
                // fields that will show in the job detail panel
                $scope.visibleFields = {
                    "Result": $scope.job.result || undef,
                    "Job GUID": $scope.job.job_guid || undef,
                    "Machine Platform Arch": $scope.job.machine_platform_architecture || undef,
                    "Machine Platform OS": $scope.job.machine_platform_os || undef,
                    "Build Platform": $scope.job.build_platform || undef,
                    "Build Arch": $scope.job.build_architecture || undef,
                    "Build OS": $scope.job.build_os || undef
                };
                /*this call retrieves (again) a job detail. can we avoid it?
                *
                * camd: this has different job detail info than we get with the resultsets.
                * specifically artifact info and log info. I considered it too heavy weight to
                * get this for each job inthe resultset, since we would only want it for hte few
                * jobs we view in this panel. */
                $http.get(thServiceDomain + $scope.job.resource_uri).
                    success(function(data) {
                        $scope.logs = data.logs;

                        data.artifacts.forEach(function(artifact) {
                            if (artifact.name !== "Structured Log") {
                                // we don't return the blobs with job, just
                                // resource_uris to them.  For the Job Artifact,
                                // we want that blob, so we need to fetch the
                                // detail to get the blob which has the
                                // tinderbox_printlines, etc.
                                $scope.artifacts[artifact.name] =$resource(
                                    thServiceDomain + artifact.resource_uri).get();
                            } else {
                                // for the structured log, we don't need the blob
                                // here, we have everything we need in the artifact
                                // as is, so just save it.
                                $scope.lvUrl = thUrl.getLogViewerUrl(artifact.id);
                            }
                        });
                    });
                JobNote = thJobNote.get();
                $scope.updateNotes();
            }
        }, true);

        $scope.starTypes = thStarTypes;

        // load the list of existing notes (including possibly a new one just
        // added).
        $scope.updateNotes = function() {
            $scope.notes = JobNote.query({job_id: $scope.job.job_id});
        };
        // when notes comes in, then set the latest note for the job
        $scope.$watch('notes', function(newValue, oldValue) {
            if (newValue && newValue.length > 0) {
                $scope.job.note=newValue[0];
            }
        });

        // open form to create a new note
        $scope.addNote = function() {
            var fci = 0;
            if ($scope.notes && $scope.notes.length > 0) {
                fci = $scope.notes[0].failure_classification_id;
            }
            $scope.newNote = new JobNote({
                job_id: $scope.job.job_id,
                note: "",
                who: $scope.username,
                failure_classification_id: fci
            });
            $scope.focusInput=true;
        };

        // done adding a new note, so clear and hide the form
        $scope.clearNewNote = function() {
            $scope.newNote = null;
        };

        // save the note and hide the form
        $scope.saveNote = function() {
            $scope.newNote.thSave();
            $scope.updateNotes();
            $scope.clearNewNote();
        };

        $scope.tabs = [
            {
                title: "Notes",
                content: "plugins/notes/main.html"
            },
            {
                title: "Tinderbox",
                content: "plugins/tinderbox/main.html"
            },
            {
                title: "Open bugs",
                content: "plugins/open_bugs_suggestions/main.html"
            },
            {
                title: "Closed bugs",
                content: "plugins/closed_bugs_suggestions/main.html"
            }
        ];

    }
);