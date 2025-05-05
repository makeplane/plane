## Core
The Core Package acts as a bridge between the modules and the executors like
cron, http and the modules, such as healthcheck or router. The view here is that
the execution for a particular module's feature can be used in many way and
should be generic enough to be used with any type of executor.

### Conventions
- Please don't use any sort of strict types from any module or package. 
- Define interfaces instead of hard types, for example if you check
  healthcheck.go, there is a runner interface defined, which enables any 
  executor to implement those methods and use the core functions.


