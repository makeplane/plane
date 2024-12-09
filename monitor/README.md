
# Monitor
Monitor a package written in go, aims to provide services responsible for
healthcheck, feature flagging and validation of entities with respect to
deployments. The services of Monitor are encapsulated in a command line
interface inside the `./cli` folder and all the features are encapsulated 
inside packages inside the lib folder `./lib` folder. 

## Convention and Adding New Features
- Each feature lies on a seprate module, and for every module, there 
  must be it's individual tests and readme associated with it, with the
  function signatures associated with it.
- Examples must be provided for each of the functions that are present inside
  the package that, it can be used as a reference manual.
- Every function should be written in such a way such that it can be consumed by
  any external host, maybe used with cron, http, cli or a seprate package on
  itself. Passing callback functions are sometimes best for such scenarios.

## Running and Usage of Monitor
Monitor relies on 4 different environment variables of execution, which are
listed below, 
- `PRIME_HOST` : The host for the prime service, defaults to
  `https://prime.plane.so`.
- `LICENSE_KEY`:  The client's license key, required for validation purposes of
  the api requests to the prime server.
- `LICENSE_VERSION`: The currently used version by the client, it's generally
  the plane app version, but it's required and needed to be passed.
- `MACHINE_SIGNATURE`: Machine signature field indicates the machine signature
  of the host machine. Say you're using monitor as a docker image on a mac, then
  we would require the `MACHINE_SIGNATURE` of mac, assuming mac's machine
  signature is associated with the license.

You can build monitor, with `make build` and test it with `make test`. Monitor
can be run with `--help` command, to check the capabilites of it.
