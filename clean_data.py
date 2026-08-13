import os
import pandas as pd
import glob

base_dir = r"C:\Users\vandu\Documents\Asset_management"
data_dir = os.path.join(base_dir, "Data")
output_dir = os.path.join(base_dir, "Data clear")

os.makedirs(output_dir, exist_ok=True)
print(f"Target output directory created/verified: {output_dir}")

# 1. Clean Employees
emp_path = os.path.join(data_dir, "Asset management", "Office", "Employees.xlsx")
emp_df = pd.read_excel(emp_path, sheet_name="Sheet1")
for col in emp_df.select_dtypes(include=["object"]).columns:
    emp_df[col] = emp_df[col].astype(str).str.strip().replace({"nan": None, "None": None, "": None})

emp_df["Employee Id"] = emp_df["Employee Id"].astype(str).str.replace(r"\.0$", "", regex=True)
emp_df["Date Of Birth"] = pd.to_datetime(emp_df["Date Of Birth"], errors="coerce").dt.strftime("%Y-%m-%d")
emp_df["Date Of Joining"] = pd.to_datetime(emp_df["Date Of Joining"], errors="coerce").dt.strftime("%Y-%m-%d")

emp_df.to_excel(os.path.join(output_dir, "01_Employees_Cleaned.xlsx"), index=False)
emp_df.to_csv(os.path.join(output_dir, "01_Employees_Cleaned.csv"), index=False, encoding="utf-8-sig")
print(f"[1/6] Saved Employees: {len(emp_df)} rows")

# 2. Clean Office Assets
off_path = os.path.join(data_dir, "Audit 2026 device", "Office assets.xlsx")
off_df = pd.read_excel(off_path, sheet_name="Asset")
for col in off_df.select_dtypes(include=["object"]).columns:
    off_df[col] = off_df[col].astype(str).str.strip().replace({"nan": None, "None": None, "": None})

off_df["Employee Id"] = off_df["Employee Id"].apply(lambda x: str(int(float(x))) if pd.notnull(x) and str(x).replace(".0","").isdigit() else x)
off_df["Date Of Joining"] = pd.to_datetime(off_df["Date Of Joining"], errors="coerce").dt.strftime("%Y-%m-%d")
off_df["SN_Clean"] = off_df["S/N"].str.strip().str.upper()

off_df.to_excel(os.path.join(output_dir, "02_Office_Assets_Cleaned.xlsx"), index=False)
off_df.to_csv(os.path.join(output_dir, "02_Office_Assets_Cleaned.csv"), index=False, encoding="utf-8-sig")
print(f"[2/6] Saved Office Assets: {len(off_df)} rows")

# 3. Clean Store Assets Audit 2026
audit_files = glob.glob(os.path.join(data_dir, "Audit 2026 device", "Data store", "Audit", "*.xlsx"))
store_rows = []

for f in sorted(audit_files):
    store_code = os.path.splitext(os.path.basename(f))[0]
    xl = pd.ExcelFile(f)
    sheet = xl.sheet_names[0]
    
    df = pd.read_excel(f, sheet_name=sheet)
    if "Category" not in df.columns and len(df.columns) >= 5:
        df = pd.read_excel(f, sheet_name=sheet, header=None)
        df = df.rename(columns={0: "No", 1: "Category", 2: "Hardware Type", 3: "Model", 4: "Qty", 5: "S/N", 6: "Note"})
    
    col_map = {}
    for c in df.columns:
        c_str = str(c).strip()
        if c_str in ["No", "No."]: col_map[c] = "No"
        elif c_str in ["Category"]: col_map[c] = "Category"
        elif c_str in ["Hardware Type", "Type Device", "Hardware"]: col_map[c] = "Hardware Type"
        elif c_str in ["Model"]: col_map[c] = "Model"
        elif c_str in ["Qty", "Qty ", "SL"]: col_map[c] = "Qty"
        elif c_str in ["S/N", "Serial Number", "Serial number"]: col_map[c] = "S/N"
        elif c_str in ["Note", "Remark"]: col_map[c] = "Note"
    
    df = df.rename(columns=col_map)
    df["StoreCode"] = store_code
    
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = df[col].astype(str).str.strip().replace({"nan": None, "None": None, "": None})
    
    cols = ["StoreCode", "No", "Category", "Hardware Type", "Model", "Qty", "S/N", "Note"]
    for c in cols:
        if c not in df.columns:
            df[c] = None
    
    df = df[cols]
    store_rows.append(df)

store_df = pd.concat(store_rows, ignore_index=True)
store_df["Hardware Type Cleaned"] = store_df["Hardware Type"].str.title().str.strip()
store_df["Category Cleaned"] = store_df["Category"].str.upper().str.strip()
store_df["SN_Clean"] = store_df["S/N"].str.strip().str.upper()

store_df.to_excel(os.path.join(output_dir, "03_Store_Assets_Audit_2026_Cleaned.xlsx"), index=False)
store_df.to_csv(os.path.join(output_dir, "03_Store_Assets_Audit_2026_Cleaned.csv"), index=False, encoding="utf-8-sig")
print(f"[3/6] Saved Store Assets Audit 2026: {len(store_df)} rows across {store_df['StoreCode'].nunique()} stores")

# 4. Clean Store Master & Firewall Info
check_path = os.path.join(data_dir, "Audit 2026 device", "Data store", "Check List.xlsx")
check_df = pd.read_excel(check_path, sheet_name="VN", header=0)
if check_df.iloc[0]["Unnamed: 0"] == "No.":
    check_df.columns = check_df.iloc[0]
    check_df = check_df.iloc[1:].reset_index(drop=True)

for col in check_df.columns:
    check_df[col] = check_df[col].astype(str).str.strip().replace({"nan": None, "None": None, "": None})

fw_path = os.path.join(data_dir, "Audit 2026 device", "Data store", "Firewall Serial Number.xlsx")
fw_df = pd.read_excel(fw_path)
for col in fw_df.columns:
    fw_df[col] = fw_df[col].astype(str).str.strip().replace({"nan": None, "None": None, "": None})

store_master = pd.merge(check_df, fw_df, left_on="Store code", right_on="Storecode", how="outer")
store_master.to_excel(os.path.join(output_dir, "04_Store_Master_Checklist_Firewall_Cleaned.xlsx"), index=False)
store_master.to_csv(os.path.join(output_dir, "04_Store_Master_Checklist_Firewall_Cleaned.csv"), index=False, encoding="utf-8-sig")
print(f"[4/6] Saved Store Master & Firewall: {len(store_master)} stores")

# 5. Clean Broken Assets & Special Cases
off_broken = pd.read_excel(os.path.join(data_dir, "Asset management", "Office", "Broken 0 sửa.xlsx"))
trans_mf = pd.read_excel(os.path.join(data_dir, "Asset management", "Office", "Transfer for Map Fashion.xlsx"))

for df in [off_broken, trans_mf]:
    for col in df.columns:
        df[col] = df[col].astype(str).str.strip().replace({"nan": None, "None": None, "": None})

with pd.ExcelWriter(os.path.join(output_dir, "05_Broken_and_Transfers_Cleaned.xlsx")) as writer:
    off_broken.to_excel(writer, sheet_name="Office_Broken", index=False)
    trans_mf.to_excel(writer, sheet_name="Transfer_Map_Fashion", index=False)
print(f"[5/6] Saved Broken & Transfer records")

# 6. Clean Transitions & Warehouse
it_tool_stock = pd.read_excel(os.path.join(data_dir, "Asset management", "Transititons", "IT tool.xlsx"), sheet_name="Infra Device (stock) ")
it_tool_trans = pd.read_excel(os.path.join(data_dir, "Asset management", "Transititons", "IT tool.xlsx"), sheet_name="Infra Device (transactions)")
minipc_status = pd.read_excel(os.path.join(data_dir, "Asset management", "Transititons", "IT tool.xlsx"), sheet_name="Mini PC status")
wh_dsv = pd.read_excel(os.path.join(data_dir, "Asset management", "Warehouse", "Asset_List_DSV.xlsx"), sheet_name="Asset List")
wh_geodis = pd.read_excel(os.path.join(data_dir, "Asset management", "Warehouse", "Geodis device.xlsx"), sheet_name="Sheet1")

with pd.ExcelWriter(os.path.join(output_dir, "06_Transitions_and_Warehouse_Cleaned.xlsx")) as writer:
    it_tool_stock.to_excel(writer, sheet_name="IT_Stock", index=False)
    it_tool_trans.to_excel(writer, sheet_name="IT_Transactions", index=False)
    minipc_status.to_excel(writer, sheet_name="MiniPC_Status", index=False)
    wh_dsv.to_excel(writer, sheet_name="Warehouse_DSV", index=False)
    wh_geodis.to_excel(writer, sheet_name="Warehouse_Geodis", index=False)
print(f"[6/6] Saved Transitions & Warehouse records")

print("\n=== ALL CLEANED FILES SAVED SUCCESSFULLY IN Data clear ===")
