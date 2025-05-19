import { KeyValue } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TestComponent } from "./test/test.component";
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [ReactiveFormsModule, TestComponent],
})
export class AppComponent {
  textAreaControl: FormControl = new FormControl('');
  maxLines: number = 10; // 最多十行
  maxLineLength: number = 80; // 每行最多80个字符
  newLineMarker: string = "\u2028"; // 用于程序添加的换行符，以便在文本框中正确显示
  cursorLocalStart: number = 0; // 光标起始位置
  cursorLocalEnd: number = 0; // 光标结束位置
  userInputValue: string = ""; // 用户输入的字符
  nowKeyDown: string = ""; // 本次按键按下的键



  /**
   * 处理文本区域选择变化事件
   * 光标起始位置和结束位置的获取，用于后续的插入和删除操作
   *
   * @param event 事件对象
   */
  textareaSelectChange(event: Event) {
    const thisEvent: HTMLTextAreaElement = (event.target as HTMLTextAreaElement);
    this.cursorLocalStart = thisEvent.selectionStart; // 光标起始位置
    this.cursorLocalEnd = thisEvent.selectionEnd; // 光标结束位置
  }

  /**
   * 监听当前按键的监听事件，用于后续的删除操作，主要监听键盘的Backspace和Delete键
   *
   * @param event 事件对象
   */
  nowKeyDownInput(event: Event) {
    let nk = event as KeyboardEvent;
    this.nowKeyDown = nk.key;
    // 如果是Ctrl+z或Ctrl+y，则不进行改动
    if(nk.ctrlKey){
      this.nowKeyDown = "Ctrl"+nk.key;
    }
    if((nk.shiftKey && nk.key === "Enter") || nk.key === "Enter"){
      this.insertUserInputValue(undefined,'\n'); // 插入换行符，并更新用户输入的字符串
    }
    if(this.nowKeyDown === "Backspace" || this.nowKeyDown === "Delete"){
      this.deleteUserInputValue(); // 删除当前光标范围内的内容
    }
  }

  /**
   * 剪切文本区域内容监听事件，删除当前光标范围内的内容，并更新用户输入的字符串
   *
   * @param event 事件对象
   */
  textareaCut(event: Event) {
    const thisEvent: string = (event.target as HTMLTextAreaElement).value;
    this.deleteUserInputValue();
  }


  /**
   * 处理文本框内容变化事件
   *
   * @param event 事件对象
   */
  textareaChange(event: Event) {
    const thisEvent: HTMLTextAreaElement = (event.target as HTMLTextAreaElement);
    let newChar: string = (event as InputEvent).data ?? ''; // 本次输入的字符
    // 如果是Ctrl+z或Ctrl+y，则不进行改动
    if(this.nowKeyDown === "Ctrlz" || this.nowKeyDown === "Ctrly"){
      this.textAreaControl.setValue(this.userInputValue.replace(this.newLineMarker, '\n'));
    };
    if (this.nowKeyDown != 'Enter' && newChar == '') return;
    newChar = this.newCharInputProcess(newChar);
    this.insertUserInputValue(undefined, newChar);
    // 根据设置的最大行数和每行最大字符数把用户输入的数据进行渲染
    this.userInputValue.replace(this.newLineMarker, '')
    this.userInputValue = this.valueShowProcess();
    this.textAreaControl.setValue(this.userInputValue.replace(this.newLineMarker, '\n'));  
  }
  
  /**
   * 处理新输入的字符串，如果用户输入了系统的专属换行符则将其转换为换行符
   *
   * @param str 需要处理的字符串
   * @returns 处理后的字符串
   */
  newCharInputProcess(str: string): string {
    if(str.match(this.newLineMarker)) return str.replace(this.newLineMarker, '\n');
    return str;
  }
  
  /**
   * 渲染处理
   *
   * @param str 输入的字符串
   * @returns 处理后的字符串，每行不超过80个字符
   */
  valueShowProcess(str: string = this.userInputValue): string {
    let showStr: string = "";
    let currentLineLength: number = 0;
    for (let i: number = 0; i < str.length; i++) {
      let char: string = str[i] as string;
      if (char === this.newLineMarker) continue;
      // 如果遇到换行符，重置计数器并保留原换行符
      if (char === '\n') {
        showStr += char;
        currentLineLength = 0;
        continue;
      }
      // 如果当前行达到80字符，插入换行符
      if (currentLineLength >= this.maxLineLength) {
        showStr += this.newLineMarker;
        currentLineLength = 0;
      }
      // 添加当前字符到结果
      showStr += char;
      currentLineLength += this.verifyHankaku(char) ? 1 : 2;
    }
    return showStr;
  }

  /**
   * 在用户光标位置插入字符
   *
   * @param userInputValue 用户输入的内容，默认值为当前用户输入值（this.userInputValue）
   * @param insertChar 要插入的字符
   */
  insertUserInputValue(uInputValue:string = this.userInputValue,insertChar: string) {
    const start = this.cursorLocalStart;
    const end = this.cursorLocalEnd;
    const before = uInputValue.substring(0, start);
    const after = uInputValue.substring(end);
    this.userInputValue = before + insertChar + after;
  }

  /**
   * 删除userInputValue中当前光标范围内的内容，并更新用户输入的字符串
   * 当用户删除或者剪切时，根据当前光标位置对用户输入的字符串进行删除处理
   */
  deleteUserInputValue(
    cursorStart: number = this.cursorLocalStart, 
    cursorEnd: number = this.cursorLocalEnd
  ) {
    let cursorStartCopy: number = cursorStart;
    let cursorEndCopy: number = cursorEnd;
    if (this.cursorLocalStart === this.cursorLocalEnd) {
      switch (this.nowKeyDown) {
        case "Backspace":
          cursorStartCopy = cursorStart-1 < 0 ? 0 : cursorStart-1;
          break;
        case "Delete":
          cursorEndCopy += 1;
          break;
        default:
          cursorStartCopy = cursorEndCopy;
      }
    }
    const before = this.userInputValue.substring(0, cursorStartCopy);
    const after = this.userInputValue.substring(cursorEndCopy);
    if(cursorStartCopy != cursorStart) cursorEnd = cursorEndCopy;
    if(cursorEndCopy != cursorEnd) cursorEnd = cursorStart;
    this.userInputValue = before + after;
    this.cursorLocalStart = cursorStart;
    this.cursorLocalStart = cursorEnd;
  }

  /**
   * 验证字符是否为半角字符
   *
   * @param char 要验证的字符
   * @returns 如果字符是半角字符，则返回 true；否则返回 false
   */
  verifyHankaku(char: string): boolean {
    // 获取字符的Unicode编码
    const charCode: number = char.charCodeAt(0);

    // 判断字符是否为半角字符
    return charCode <= 0x7F || (charCode >= 0xFF61 && charCode <= 0xFF9F);
  }
}
