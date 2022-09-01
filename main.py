import MDD
from tkinter import *

def btncmd():
    import numpy as np
    import matplotlib.pyplot as plt
    import MDD_ALL

    # 먼저 arr를 np.empty를 통해 초기화합니다.
    tkr = np.empty((0, 3), int)

    # 배열을 추가합니다.
    # 추가하는 배열의 요소수는 초기화했던 길이와 동일해야합니다.
    # axis = 0은 행으로 추가한다는 뜻입니다.
    tkr = np.append(tkr, np.array([['TSLA', 'AAPL', 'MSFT']]), axis=0)
    tkr = np.append(tkr, np.array([['GOOGL', 'NVDA', 'MRNA']]), axis=0)

    s_year = '2010'

    # 빈 그래프 3*2개 그리기
    f, axes = plt.subplots(2, 3)
    f.set_size_inches((20, 15))
    plt.subplots_adjust(wspace=0.3, hspace=0.3)

    for i in range(0, len(tkr)):
        for j in range(0, len(tkr[0,])):
            data = MDD_ALL.MDD_G(s_year, tkr[i,j])
            title = tkr[i,j] + " MDD"
            # [i, j] 위치 그래프
            axes[i, j].plot(data.index, data["MDD"])
            axes[i, j].plot(data.index, data["Mean"], label="Mean1", color="yellow")
            axes[i, j].plot(data.index, data["Mean2"], label="Mean2", color="orange")
            axes[i, j].plot(data.index, data["Mean3"], label="Mean3", color="red")

            axes[i, j].set_title(title)
            #axes[0, 0].set_title('bar graph example', fontsize=12)
            #axes[i, j].legend()
            axes[i, j].text(data.index[-1], data["MDD"][-1], round(data["MDD"][-1], 2), color='royalblue')
            axes[i, j].text(data.index[-1], data["Mean"][-1], round(data["Mean"][-1], 2))
            axes[i, j].text(data.index[-1], data["Mean2"][-1], round(data["Mean2"][-1], 2), color='orange')
            axes[i, j].text(data.index[-1], data["Mean3"][-1], round(data["Mean3"][-1], 2), color='red')
            #####
            #axes[i, j].plot(['x', 'y', 'z'], [15, 13, 18], color=['r', 'g', 'y'], alpha=0.4)

    mng = plt.get_current_fig_manager()
    mng.window.state('zoomed')
    plt.show()

### Main ###
root = Tk()
root.title("MDD ALL")
root.geometry("512x300+600+200")

##객체위치
x_loc = 170
y_loc = 50

label1 = Label(root, text='MDD 그래프 생성', font=('Arial bold',16))
label1.pack()
label1.place(x=x_loc, y=y_loc)

##MDD 버튼 설정
btn1 = Button(root, width=15, height=3, text="Go!", font=('Arial bold',12), command=btncmd)
btn1.pack()
btn1.place(x=x_loc, y=y_loc+100)

root.mainloop()

print('Sart')
#MDD_ALL()
print('Success')