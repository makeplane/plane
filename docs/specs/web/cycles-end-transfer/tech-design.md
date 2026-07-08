# Tech Design — Fin de cycle & auto-transfert

> Intention technique avant implémentation. À valider avant /superpowers:write-plan.

## Approche pressentie

1. Implémenter `EndCycleModal` dans `apps/web/ce/components/cycles/end-cycle/modal.tsx` : liste des items incomplets (count), dropdown des cycles cibles (futurs/actifs), appel au service de transfert existant (`cycleService`), toast de confirmation.
2. Brancher `CycleAdditionalActions` (bouton « End cycle » visible quand la date de fin est atteinte ou sur action manuelle admin).
3. `TransferHopInfo` : afficher le(s) transfert(s) subis par un work item à partir de l'activité existante.

## Points ouverts

- Où l'API expose le décompte « transférable » ? (sinon calcul client depuis le store issues du cycle)
- Droits : action réservée ADMIN/MEMBER du projet ?

## Risques

- Faible — aucun changement API, feature isolée dans ce/.
