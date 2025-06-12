#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import pandas as pd
import csv

desktop_path = os.path.expanduser("~/Desktop/newData")
csv_files = [f for f in os.listdir(desktop_path) if f.endswith(".csv")]

dataframes = []
for file in csv_files:
    file_path = os.path.join(desktop_path, file)
    df = pd.read_csv(file_path)

    if 'Text' in df.columns and 'Completion' in df.columns:
        # 이미 큰따옴표로 감싸진 문장은 그대로, 아닌 경우만 감쌈
        def quote_if_needed(text):
            text = str(text)
            if text.startswith('"') and text.endswith('"'):
                return text
            else:
                return f'"{text}"'

        df['Text'] = df['Text'].apply(quote_if_needed)
        dataframes.append(df)
    else:
        print(f"⚠️ 파일 {file}에는 'Text'와 'Completion' 열이 없음 — 무시됨")

# 하나로 합치기
combined_df = pd.concat(dataframes, ignore_index=True)

# CSV로 저장 (quotechar 없음, escapechar 필수)
output_path = os.path.join(desktop_path, "merged_final.csv")
combined_df.to_csv(output_path, index=False, quoting=csv.QUOTE_NONE, escapechar='\\')

print(f"✅ 저장 완료: {output_path}")
