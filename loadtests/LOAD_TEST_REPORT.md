# Production sizing and guide for infra • Plane

**infrastructure sizing and deployment guidance** for running Plane in production. The recommendations are based on sustained load testing with mixed read-write traffic and are intended to define **operating ranges, observed behavior, and scaling actions**.

The document deliberately focuses on **measured outcomes and configuration boundaries**, without qualitative judgments.

## Scope and Assumptions

These recommendations assume the following workload characteristics:

* Up to **1000 concurrent users**

  * Approximately **800 read-oriented users** (browsing, viewing)

  * Approximately **200 write-oriented users** (issue creation, updates)

* Sustained concurrency rather than short-lived spikes

* Authenticated API access

* Default Plane API behavior without artificial caching

The intent is to reflect typical collaborative usage patterns.

## System Architecture Overview

### Application Layer

* Kubernetes-based deployment (EKS / GKE / AKS)

* Stateless Plane application pods

### Database Layer

* Amazon RDS PostgreSQL

* RDS Proxy enabled

Read scalability and write throughput are handled independently through horizontal application scaling and database capacity.

## Database Sizing

### Recommended RDS Instance Classes

| Concurrent Users | Instance Class                        |
| ---------------- | ------------------------------------- |
| ≤ 300            | `db.m6gd.large`                       |
| 500–800          | `db.m6gd.xlarge`                      |
| ≥ 1000           | `db.m6gd.2xlarge` or `db.r6gd.xlarge` |

### Observed Characteristics

* Increasing CPU reduces transaction duration under write load

* Additional memory improves buffer cache and index residency

* NVMe-backed storage improves write and WAL throughput

Scaling the database primarily affects **tail latency under sustained write pressure**.

## RDS Proxy Configuration

RDS Proxy is required for deployments beyond small-team usage.

### Configuration Used in Load Testing

```json
{
  "MaxConnectionsPercent": 70,
  "MaxIdleConnectionsPercent": 20,
  "ConnectionBorrowTimeout": 5
}
```

### Operational Notes

* Connection limits prevent database saturation during traffic bursts

* Idle connection limits reduce memory pressure on the database

* Short borrow timeouts surface backpressure early

## Application Pod Sizing

### Per-Pod Resource Allocation

| Resource | Value          |
| -------- | -------------- |
| CPU      | 2 vCPU         |
| Memory   | 4–5 GiB        |
| Requests | 1 vCPU / 3 GiB |
| Limits   | 2 vCPU / 4 GiB |

### Recommended Replica Counts

| Concurrent Users | Pods  |
| ---------------- | ----- |
| ≤ 300            | 4     |
| 500–800          | 6–8   |
| ≥ 1000           | 10–12 |

Increasing replica count reduces request queue depth and improves tail latency.

## Connection Management

With RDS Proxy enabled:

* Keep total database connections below **50% of instance capacity**

* Avoid per-request connection creation

These constraints were maintained during testing and did not represent a limiting factor.

## Observed Performance Characteristics

The following metrics were observed during sustained load tests at approximately **1000 concurrent users**:

| Metric       | Observed Range      |
| ------------ | ------------------- |
| Request rate | ~80–90 requests/sec |
| Error rate   | ~1–3%               |
| p50 latency  | < 1s                |
| p90 latency  | 10–25s              |
| p95 latency  | 25–30s              |

Latency increases were correlated with concurrent write activity rather than CPU, memory, or connection exhaustion.

## Read vs Write Behavior

* Read requests scale linearly with application replicas

* Write requests exhibit increased latency under concurrency

* Reads continue to complete successfully while writes queue

This behavior was consistent across test runs and configurations.

## Scaling Actions

When approaching observed limits:

* Increase database instance size before increasing connection limits

* Increase application replica count before increasing per-pod resources

* Limit or schedule write-heavy operations during peak usage

Increasing database `max_connections` was not observed to improve tail latency.

## Non-Goals

The following were not objectives of this sizing guidance:

* Minimizing worst-case write latency at extreme concurrency

* Supporting unbounded write bursts

* Eliminating backpressure under saturation

The focus is on predictable behavior within defined operating ranges.

## Results
```

  █ THRESHOLDS

    http_req_duration
    ✓ 'p(95)<25000' p(95)=22.45s

    http_req_failed
    ✓ 'rate<0.05' rate=0.62%


  █ TOTAL RESULTS

    checks_total.......: 46388  69.558403/s
    checks_succeeded...: 99.43% 46125 out of 46388
    checks_failed......: 0.56%  263 out of 46388

    ✗ read status is 2xx
      ↳  99% — ✓ 38985 / ✗ 59
    ✗ write create is 2xx
      ↳  97% — ✓ 7140 / ✗ 204

    HTTP
    http_req_duration..............: avg=7.11s  min=219.86ms med=4.54s max=1m0s   p(90)=17.71s p(95)=22.45s
      { expected_response:true }...: avg=6.97s  min=250.97ms med=4.52s max=59.96s p(90)=17.51s p(95)=22.02s
    http_req_failed................: 0.62%  335 out of 53527
    http_reqs......................: 53527  80.263271/s

    EXECUTION
    iteration_duration.............: avg=10.46s min=2.25s    med=7.93s max=1m27s  p(90)=21.43s p(95)=26.44s
    iterations.....................: 46383  69.550906/s
    vus............................: 1      min=1            max=1000
    vus_max........................: 1000   min=1000         max=1000

    NETWORK
    data_received..................: 1.2 GB 1.9 MB/s
    data_sent......................: 19 MB  28 kB/s




running (11m06.9s), 0000/1000 VUs, 46383 complete and 7 interrupted iterations
read_scenario  ✓ [======================================] 000/800 VUs  11m0s
write_scenario ✓ [======================================] 000/200 VUs  11m0s
```

## Summary

This document defines observed system behavior and recommended configurations for operating Plane at scale. The values and ranges presented are derived from sustained load testing and are intended to be used as reference points for deployment and capacity planning.