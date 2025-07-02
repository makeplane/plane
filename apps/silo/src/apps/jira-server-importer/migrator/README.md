
## Migrators
Migrators server as a heart of the importer. The structure is to declare the
migrator's transformation inside a folder, such that it's flexible enough to add
more migration strategies. Migrators must be created with such atomicity in mind
that even if we try to convert 1 issue, or 100 issue it should support it.

