import pandas as pd
import numpy as np

df = pd.read_csv("matched.csv")
df1 = pd.pivot_table(df,index=["course"],values=["totalMatched"],aggfunc=np.sum)
print(df1)
