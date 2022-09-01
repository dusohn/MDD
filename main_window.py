import tkinter.messagebox as msgbox
import yfinance as yf
import MDD
from tkinter import *

def btncmd():
    chk_val = chkclick.get()
    #print(chk_val)
    #msgbox.showinfo("알림", chk_val)

    s_val = s_symbol.get()
    s_symbol.delete(0, END)
    s_symbol.insert(0, s_val.upper())

    f_info = MDD.GetName(s_symbol.get())
    label_name.config(text=f_info)

    MDD.MDD_G(s_year.get(), s_symbol.get(), chk_val)

def pe_btncmd():
    s_val = s_symbol.get()
    #msgbox.showinfo("알림", s_val)

    symbol = yf.Ticker("tsla").info
    pe = symbol["trailingPE"]
    f_pe= symbol["forwardPE"]

    symbol = yf.Ticker(s_val).info
    label_pe.config(text=pe)
    label_fpe.config(text=f_pe)

root = Tk()
root.title("MDD")
root.geometry("512x300+600+200")

##객체위치
x_loc = 70
y_loc = 50

label1 = Label(root, text='MDD 그래프 생성', font=('Arial bold',12))
label1.pack()
#label1.place(x=50, y=10)

## Start Year
label2 = Label(root, text='Start Year', font=('Arial',12))
label2.pack()
label2.place(x=x_loc, y=y_loc)

s_year = Entry(root, width=10, justify="center", font=('Arial bold',12))
s_year.pack()
s_year.insert(0, "2010")
s_year.place(x=x_loc+80, y=y_loc)

## Symbol
label3 = Label(root, text='Symbol', font=('Arial',12))
label3.pack()
label3.place(x=x_loc, y=y_loc+30)

s_symbol = Entry(root, width=10, justify="center", font=('Arial bold',12))
s_symbol.pack()
s_symbol.insert(0, "TSLA")
s_symbol.place(x=x_loc+80, y=y_loc+30)

label_name = Label(root, text='Symbol name', font=('Arial bold',12))
label_name.pack()
label_name.place(x=x_loc+180, y=y_loc+30)
f_info = MDD.GetName(s_symbol.get())
label_name.config(text=f_info)

##파일저장 여부
label4 = Label(root, text='파일저장', font=('Arial',12))
label4.pack()
label4.place(x=x_loc, y=y_loc+60)

##PE
label5 = Label(root, text='PE', font=('Arial',12))
label5.pack()
label5.place(x=x_loc, y=y_loc+90)

label_pe = Label(root, text='', font=('Arial bold',12))
label_pe.pack()
label_pe.place(x=x_loc+80, y=y_loc+90)


##Forward PE
label5 = Label(root, text='F/PE', font=('Arial',12))
label5.pack()
label5.place(x=x_loc, y=y_loc+120)
label_fpe = Label(root, text='', font=('Arial bold',12))
label_fpe.pack()
label_fpe.place(x=x_loc+80, y=y_loc+120)

chkclick = IntVar()
chkbox = Checkbutton(root, variable=chkclick)
chkbox.pack()
chkbox.place(x=x_loc+80, y=y_loc+60)

##MDD 버튼 설정
btn1 = Button(root, width=15, height=3, text="MDD 생성", font=('Arial bold',12), command=btncmd)
btn1.pack()
btn1.place(x=x_loc, y=y_loc+160)
#btn1.place(x=180, y=160)

##PE 버튼 설정
btn1 = Button(root, width=15, height=3, text="PE", font=('Arial bold',12), command=pe_btncmd)
btn1.pack()
btn1.place(x=x_loc+200, y=y_loc+160)

root.mainloop()