# This is a sample Python script.

# Press Shift+F10 to execute it or replace it with your code.
# Press Double Shift to search everywhere for classes, files, tool windows, actions, and settings.
def MDD_G(start_year, symbol, file_chk):
    import numpy as np
    import yfinance as yf
    import matplotlib.pyplot as plt

    data = yf.download(symbol, start=start_year + '-01-01')

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

    #print("MDD : ", data.iloc[-1,5])

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

    if file_chk == 1:
        #print("νμΌμμ±")
        data.to_csv(symbol + ".csv", sep=",")

    #################
    plt.cla()
    plt.plot(data.index, data["MDD"])
    #plt.plot(data.index, data["Mean"], label = round(data.iloc[0, 7],2), color = "yellow")
    plt.plot(data.index, data["Mean"], label="Mean1", color="yellow")
    plt.plot(data.index, data["Mean2"], label = "Mean2", color = "orange")
    plt.plot(data.index, data["Mean3"], label = "Mean3", color = "red")

    plt.title(symbol.upper() + ' MDD')
    plt.legend()
    mng = plt.get_current_fig_manager()
#    mng.window.state('zoomed')
    plt.text(data.index[-1], data["MDD"][-1], round(data["MDD"][-1], 2), color='royalblue')
    plt.text(data.index[-1], data["Mean"][-1], round(data["Mean"][-1], 2))
    plt.text(data.index[-1], data["Mean2"][-1], round(data["Mean2"][-1], 2), color = 'orange')
    plt.text(data.index[-1],data["Mean3"][-1], round(data["Mean3"][-1],2), color = 'red')

    plt.show()

def GetName(symbol):
    import numpy as np
    import pandas as pd
    import yfinance as yf

    Location = 'D:/'
    File = 'Ticker.xlsx'

    data_pd = pd.read_excel('{}/{}'.format(Location, File), header=0, index_col=None, names=None)
    find_pd = data_pd[data_pd['Ticker'] == symbol]

    if find_pd.size > 0:
        Name = find_pd.iloc[0,1]
    else:
        Name = yf.Ticker(symbol).info["shortName"]

    return Name