## Jira Importer
With Jira Importer as a folder, we are bringing a directory level isolation
boundary of code, such that anything that belong inside Jira will reside
inside this particular folder. While we do require to maintain the isolation
between the code, it doesn't forbid us to import any asset from jira inside the
runner or worker.
