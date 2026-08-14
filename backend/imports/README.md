# 📂 Import Folder

Place your Excel (`.xlsx`) or CSV (`.csv`) files in this folder before running the import command.

## How to Use

1. Copy your Excel file here (e.g., `Ad2Ship_Onboarding.xlsx`)
2. Open terminal in the `backend` folder
3. Run: `npm run import`

## Supported Files

- `Ad2Ship_Onboarding.xlsx` → Imports to **Influencers** collection
- `brands.xlsx` → Imports to **Brands** collection

## Notes

- Do NOT rename this folder
- Original Excel column names are supported (e.g., `BRAND NAME`, `PRODUCT LINK`)
- IDs are auto-generated — no need to add ID columns
