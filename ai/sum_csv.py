import pandas as pd

# UTF-8로 불러오기
df = pd.read_csv("./data/합본.csv", encoding="utf-8")

# utf-8-sig로 다시 저장
df.to_csv("./data/합본_fixed.csv", index=False, encoding="utf-8-sig")
