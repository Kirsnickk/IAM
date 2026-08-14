# Data clear v2 — relational staging dataset

Generated from raw files under `Data/` by `clean_data.py`. Raw files are not modified.

## Why v2 exists
The previous output mixed snapshots and aggregates. It kept quantity rows with multiline serials, duplicated office assets, and merged store/firewall rows by row position. v2 separates master data, physical assets, observations, assignments, transfers, maintenance, warehouses, and quality issues.

## Link keys
- `employee_id`: source HR Employee Id; used by `asset_assignments.csv`.
- `department_code`: HR Department Cost Center Id where available.
- `location_code`: normalized store code (`VA01`, `VN05`, `A001`, `VN28`, ...), plus `HCM`, `HN`, `DSV`, `GEODIS`, `IT_STOCK`.
- `asset_key`: `AID:<Asset ID>` first, then `SN:<serial>`, then deterministic `OBS:<hash>` for units without identity.
- `asset_code`: source Asset ID when available; otherwise deterministic generated code.
- `model_code` and `category_code`: stable mapping tables.

## Important data rules
1. A row with `Qty=3` and three serials becomes three asset units.
2. A row with quantity greater than serial count creates review units without serials.
3. Duplicate serials are never silently overwritten. The canonical asset is retained, every raw observation is retained, and the conflict is listed in `data_quality_issues.csv`.
4. Store rows marked `DSV` are physically located at `DSV` and keep the intended store in `intended_location_code`.
5. Transfer-to-Map-Fashion records are `PENDING` and `needs_review=true` because the source has no date, requester, approval, or confirmed destination master.
6. Planned new-store shipment data is in `planned_shipments.csv`; it is not counted as current inventory.

## Output counts
```json
{
  "locations": 62,
  "departments": 14,
  "employees": 69,
  "categories": 8,
  "models": 215,
  "assets": 856,
  "assets_with_serial": 666,
  "assignments": 70,
  "transfers": 10,
  "maintenance_tickets": 16,
  "warehouses": 2,
  "stock_transactions": 1140,
  "planned_shipments": 109,
  "issues": 251,
  "error_issues": 0
}
```

## Import gate
Do not import to production while `data_quality_issues.csv` contains unresolved identity/location conflicts. First review the issues, then run the importer against a staging Neon branch.
