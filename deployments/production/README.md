# Coordinated production deploy (P10A)

Host scripts and GitHub workflows for releasing this Community fork as one image set.

Do not enable Watchtower. Do not deploy from mutable tags without a digest manifest. Do not copy `.env.prod.example` over production `.env`.

Full operator guide: [`docs/implementations/p10a-coordinated-production-deploy.md`](../../docs/implementations/p10a-coordinated-production-deploy.md)
