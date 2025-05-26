#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue May 13 18:57:03 2025

@author: sung0
"""

import pandas as pd
import re

# 파일 경로 설정
input_file = '/Users/sung0/Desktop/newData/havetofix.csv'  # 원본 파일 경로
output_file = '/Users/sung0/Desktop/newData/fixedData.csv'  # 저장할 파일 경로

# CSV 파일 불러오기 (header 없다고 가정)
df = pd.read_csv(input_file, header=None, names=["Text", "Label"], dtype=str)

# 함수: """문장""" -> "문장"
def clean_quotes(text):
    if isinstance(text, str) and re.fullmatch(r'\"\"\".*\"\"\"', text):
        return '"' + text[3:-3] + '"'
    return text

# 적용
df['Text'] = df['Text'].apply(clean_quotes)

# 저장
df.to_csv(output_file, index=False, header=False, quoting=0)

print("✅ 완료: 세 겹 큰따옴표 → 한 쌍 큰따옴표 변환")
