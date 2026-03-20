import urllib.request, pandas as pd, io
url = 'https://wago.tools/db2/ItemSparse/csv?locale=zhCN'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
res = urllib.request.urlopen(req)
raw = res.read().decode('utf-8')
df = pd.read_csv(io.StringIO(raw), low_memory=False)
items = df[df['StatModifier_bonusStat_0'] > 0].head(5)
for _, item in items.iterrows():
    print(item['Display_lang'])
    for i in range(5):
        if item[f'StatModifier_bonusStat_{i}'] > 0:
            print(f"  Stat {item[f'StatModifier_bonusStat_{i}']}: {item[f'StatPercentEditor_{i}']}")
