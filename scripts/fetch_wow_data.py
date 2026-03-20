import urllib.request
import pandas as pd
import io
import json
import os
import sys

# Wago DB2 API Endpoints for Chinese Locale
BASE_URL = "https://wago.tools/db2"
LOCALE = "zhCN"
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

def fetch_csv(table_name):
    print(f"Downloading {table_name}.csv from wago.tools...")
    url = f"{BASE_URL}/{table_name}/csv?locale={LOCALE}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        res = urllib.request.urlopen(req)
        raw_csv = res.read().decode('utf-8')
        return pd.read_csv(io.StringIO(raw_csv), low_memory=False)
    except Exception as e:
        print(f"Error fetching {table_name}: {e}")
        sys.exit(1)

def main():
    # 1. Fetch data
    df_ji = fetch_csv('JournalInstance')
    df_je = fetch_csv('JournalEncounter')
    df_jei = fetch_csv('JournalEncounterItem')
    df_item_sparse = fetch_csv('ItemSparse')
    df_item = fetch_csv('Item')

    # Target Raids for our system
    target_raids = ['虚影尖塔', '尼鲁巴尔王宫', '梦境裂隙', '解放安迪雷尔', '安迪雷尔']
    df_ji_filtered = df_ji[df_ji['Name_lang'].isin(target_raids)].copy()
    
    # 2. Join Encounters to Instances
    encounters = pd.merge(df_je, df_ji_filtered[['ID', 'Name_lang']], left_on='JournalInstanceID', right_on='ID', suffixes=('_boss', '_raid'))
    
    # 3. Join Items to Encounters via JournalEncounterItem
    encounter_items = pd.merge(df_jei, encounters[['ID_boss', 'Name_lang_boss', 'JournalInstanceID', 'Name_lang_raid']], left_on='JournalEncounterID', right_on='ID_boss')
    
    # 4. Join Item metadata
    merged_items = pd.merge(encounter_items, df_item_sparse[['ID', 'Display_lang', 'ItemLevel', 'OverallQualityID', 'InventoryType']], left_on='ItemID', right_on='ID')
    merged_items = pd.merge(merged_items, df_item[['ID', 'ClassID', 'SubclassID']], left_on='ItemID', right_on='ID')
    
    # Map slot types (InventoryType)
    inventory_map = {
        1: 'head', 2: 'neck', 3: 'shoulder', 4: 'shirt', 5: 'chest', 6: 'waist', 7: 'legs', 8: 'feet', 
        9: 'wrist', 10: 'hands', 11: 'finger', 12: 'relic', 13: 'one_hand', 14: 'shield', 15: 'bow', 
        16: 'cloak', 17: 'two_hand', 21: 'main_hand', 22: 'off_hand', 23: 'tome', 25: 'thrown', 26: 'gun'
    }
    
    quality_map = { 2: 'uncommon', 3: 'rare', 4: 'epic', 5: 'legendary' }
    
    armor_map = { 1: 'cloth', 2: 'leather', 3: 'mail', 4: 'plate', 6: 'shield' }
    
    weapon_map = {
        0: 'axe_1h', 1: 'axe_2h', 2: 'bow', 3: 'gun', 4: 'mace_1h', 5: 'mace_2h',
        6: 'polearm', 7: 'sword_1h', 8: 'sword_2h', 9: 'warglaive', 10: 'staff',
        13: 'fist_weapon', 15: 'dagger', 18: 'crossbow', 19: 'wand'
    }
    
    valid_slots = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 21, 22, 23, 25, 26]
    merged_items = merged_items[merged_items['InventoryType'].isin(valid_slots)]

    raids_dict = {}
    for _, row in merged_items.iterrows():
        raid_id = f"raid_{row['JournalInstanceID']}"
        raid_name = row['Name_lang_raid']
        
        boss_id = f"boss_{row['JournalEncounterID']}"
        boss_name = row['Name_lang_boss']
        
        item_id = str(row['ItemID'])
        item_name = str(row['Display_lang'])
        item_level = int(row['ItemLevel'])
        slot = inventory_map.get(int(row['InventoryType']), 'unknown')
        quality = quality_map.get(int(row['OverallQualityID']), 'epic')
        
        class_id = int(row['ClassID'])
        subclass_id = int(row['SubclassID'])
        armor_type = armor_map.get(subclass_id, None) if class_id == 4 else None
        weapon_type = weapon_map.get(subclass_id, None) if class_id == 2 else None
        
        if pd.isna(item_name) or str(item_name).strip() == '':
            continue
            
        is_tier = '套装' in item_name or '护甲' in item_name # simple heuristic or skip
        # For tier, we can skip explicit check or just rely on items
        
        if raid_id not in raids_dict:
            raids_dict[raid_id] = {
                "id": raid_id,
                "nameZh": raid_name,
                "expansion": "12.0",
                "bosses": {}
            }
            
        if boss_id not in raids_dict[raid_id]['bosses']:
            raids_dict[raid_id]['bosses'][boss_id] = {
                "id": boss_id,
                "nameZh": boss_name,
                "loot": []
            }
            
        item_obj = {
            "id": item_id,
            "nameZh": item_name,
            "slot": slot,
            "quality": quality,
            "itemLevel": item_level
        }
        if armor_type:
            item_obj['armorType'] = armor_type
        if weapon_type:
            item_obj['weaponType'] = weapon_type
            
        raids_dict[raid_id]['bosses'][boss_id]['loot'].append(item_obj)
        
    # Convert dicts to lists
    final_raids = []
    for raid in raids_dict.values():
        raid['bosses'] = list(raid['bosses'].values())
        final_raids.append(raid)
        
    # Read the existing wow-data.json to preserve other non-raid config (slotNames, classArmorTypes)
    shared_pkg_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'packages', 'shared', 'src', 'wow-data.json')
    try:
        with open(shared_pkg_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception:
        data = {}
        
    data['raids'] = final_raids
    
    with open(shared_pkg_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully generated wow-data.json at {shared_pkg_path}!")
    total_items = sum(len(boss['loot']) for r in final_raids for boss in r['bosses'])
    print(f"Total Raids: {len(final_raids)}, Total Items Mapped: {total_items}")

if __name__ == '__main__':
    main()
