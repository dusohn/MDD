import numpy as np

# 먼저 arr를 np.empty를 통해 초기화합니다.
tkr = np.empty((0, 3), int)

# 배열을 추가합니다.
# 추가하는 배열의 요소수는 초기화했던 길이와 동일해야합니다.
# axis = 0은 행으로 추가한다는 뜻입니다.
tkr = np.append(tkr, np.array([['TSLA', 'AAPL', 'MSFT']]), axis=0)
tkr = np.append(tkr, np.array([['GOOGL', 'NVDA', 'MRNA']]), axis=0)

print(len(tkr[0,]))

#for i in range(0, len(tkr)):
#    print(tkr[i])