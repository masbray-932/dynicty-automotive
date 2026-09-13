# Homepage Search Contract

The Homepage submits a standard `GET` request to `/cars`. Phase 3 must read these optional URL parameters without requiring client state.

| Parameter | Value | Source | Behavior when absent |
| --- | --- | --- | --- |
| `condition` | `NEW` or `USED` | Stable `CarCondition` enum | All conditions |
| `brand` | Brand slug such as `toyota` | Database `Brand.slug` | All brands |
| `model` | Model slug such as `avanza` | Database `CarModel.slug` | All models |
| `q` | Trimmed free text | Visitor input | No keyword constraint |
| `minPrice` | Non-negative digit string | Catalog filter | No minimum |
| `maxPrice` | Non-negative digit string | Catalog filter | No maximum |
| `minYear` | Four-digit year from 1900 through next year | Catalog filter | No minimum |
| `maxYear` | Four-digit year from 1900 through next year | Catalog filter | No maximum |
| `transmission` | Actual stored public option | AVAILABLE inventory | All transmissions |
| `sort` | `newest`, `price-asc`, `price-desc`, `year-desc`, or `year-asc` | Catalog control | `newest` |
| `page` | Positive integer | Catalog pagination | `1` |

Examples:

- `/cars?condition=NEW`
- `/cars?condition=USED&brand=toyota`
- `/cars?brand=toyota&model=avanza&q=G`
- `/cars?condition=USED&brand=toyota&minYear=2020&sort=price-asc&page=2`

Empty/default values are omitted from generated links. Phase 3 validates every supported parameter, resets `page` when filters or sorting change, and preserves filters in pagination links. Brand/model dropdowns are database-driven. A model requires a selected matching brand. Invalid scalar values are ignored with a visible notice; reversed ranges are removed; invalid database combinations produce zero results with a safe explanation. Category and Homepage links remain compatible.
