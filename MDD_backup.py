# This is a sample Python script.

# Press Shift+F10 to execute it or replace it with your code.
# Press Double Shift to search everywhere for classes, files, tool windows, actions, and settings.
import numpy as np
import yfinance as yf
import matplotlib.pyplot as plt

data = yf.download('TSLA', start='2010-01-01')

data.insert(4, 'Max', 0)
data.insert(5, 'MDD', 0)
data.insert(6, 'Inflection', np.nan)

max0 = data.iloc[0,3]

for i in range(0, len(data)):
    if i == 0:
        i_bef = 0
    else:
        i_bef = i - 1

    lmax = max(data.iloc[i_bef, 4], data.iloc[i, 3])
    data.iloc[i, 4] = lmax                           #Local max
    data.iloc[i, 5] = (data.iloc[i,3] - lmax) / lmax #MDD

for i in range(0, len(data)):
    if i == 0:
        i_bef = 0
    else:
        i_bef = i - 1

    if i == (len(data) - 1):
        i_next = i
    else:
        i_next = i + 1

    if data.iloc[i_bef, 5] > data.iloc[i, 5] < data.iloc[i_next, 5]:
        data.iloc[i, 6] = data.iloc[i, 5]           #Inflection point

avg = data["Inflection"].sum() / data["Inflection"].count()
data.insert(7, 'Mean', avg)

#2nd Mean
data.insert(8, 'Inflection2', np.nan)

for i in range(0, len(data)):
    if data.iloc[i, 5] < avg:
        data.iloc[i, 8] = data.iloc[i, 5]

avg = data["Inflection2"].sum() / data["Inflection2"].count()
data.insert(9, 'Mean2', avg)

#3rd Mean
data.insert(10, 'Inflection3', np.nan)

for i in range(0, len(data)):
    if data.iloc[i, 8] < avg:
        data.iloc[i, 10] = data.iloc[i, 8]

avg = data["Inflection3"].sum() / data["Inflection3"].count()
data.insert(11, 'Mean3', avg)

data.to_csv("tsla.csv", sep=",")

#################
plt.plot(data.index, data["MDD"])
plt.plot(data.index, data["Mean"], label = round(data.iloc[0, 7],2), color = "yellow")
plt.plot(data.index, data["Mean2"], label = round(data.iloc[0, 9],2), color = "orange")
plt.plot(data.index, data["Mean3"], label = round(data.iloc[0, 11],2), color = "red")

plt.legend()
plt.show()