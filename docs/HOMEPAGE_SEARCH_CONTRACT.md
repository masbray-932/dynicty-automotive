# Homepage Search Contract

The Homepage submits a standard `GET` request to `/cars`. Phase 3 must read these optional URL parameters without requiring client state.

| Parameter | Value | Source | Behavior when absent |
| --- | --- | --- | --- |
| `condition` | `NEW` or `USED` | Stable `CarCondition` enum | All conditions |
| `brand` | Brand slug such as `toyota` | Database `Brand.slug` | All brands |
| `model` | Model slug such as `avanza` | Database `CarModel.slug` | All models |
| `q` | Trimmed free text | Visitor input | No keyword constraint |

Examples:

- `/cars?condition=NEW`
- `/cars?condition=USED&brand=toyota`
- `/cars?brand=toyota&model=avanza&q=G`

Empty values are omitted. Invalid condition values are omitted by the shared query builder. Brand/model dropdowns are database-driven; choosing a brand narrows the Homepage model choices. Phase 3 remains responsible for validating received parameters, enforcing public visibility, applying filters, and defining pagination/sorting. Category and brand links use the same contract.
