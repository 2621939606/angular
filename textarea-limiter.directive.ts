import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  Optional,
  Output,
  Self,
} from '@angular/core';
import { AbstractControl, NgControl } from '@angular/forms';

@Directive({
  selector: '[libTextareaLimiter]',
})
export class TextareaLimiterDirective {
  // プログラムが追加する改行記号。テキストボックスで正しく表示するために使用。
  public newLineMarker: string = '\u2028';

  // カーソルの開始位置
  public cursorLocalStart: number = 0;

  // カーソルの終了位置
  public cursorLocalEnd: number = 0;

  // ユーザーが入力した文字
  public userInputValue: string = '';

  // 今回のキー押下で押されたキー
  public nowKeyDown: string = '';

  public isComposition: boolean = false;

  public thisControl!: AbstractControl;

  constructor(@Optional() @Self() private ngControl: NgControl) {}

  ngAfterViewInit() {
    if (!this.ngControl?.control) return;
    // 当前绑定的 FormControl 对象
    this.thisControl = this.ngControl.control;
    this.userInputValue = this.ngControl.value;
  }

  /** 全体の最大文字数（全角は2文字としてカウント） */
  @Input({ required: true }) maxTotalLength!: number;

  /** 1行あたりの最大文字数（全角は2文字としてカウント） */
  @Input({ required: true }) maxLineLength!: number;

  /** 最大行数（指定がない場合は無制限） */
  @Input() maxLines?: number;

  /** true の場合、最大行数を超えた内容は自動で切り捨てる */
  @Input() autoTruncate: boolean = false;

  /**
   * 行数制限の状態変化イベント（autoTruncate=false のときのみ発火）
   * @example { valid: true } または { valid: false }
   */
  @Output() linesValidityChanged = new EventEmitter<{ valid: boolean }>();

  @HostListener('compositionstart', ['$event'])
  onCompositionStart(event: CompositionEvent) {
    this.isComposition = true;
  }

  @HostListener('compositionupdate', ['$event'])
  onCompositionUpdate(event: CompositionEvent) {
    this.isComposition = true;
  }

  @HostListener('compositionend', ['$event'])
  onCompositionEnd(event: CompositionEvent) {
    this.userInputValue = this.insertUserInputValue(event.data);
    this.isComposition = false;
    this.setCursorValueAndLocal(event);
  }

  @HostListener('blur', ['$event'])
  onBlur(event: FocusEvent) {
    // this.validateLines(event.target as HTMLTextAreaElement);
  }

  /**
   * テキストエリアの選択変更イベントを処理する
   * カーソルの開始位置と終了位置を取得し、後の挿入・削除操作に使用する
   *
   * @param event イベントオブジェクト
   */
  @HostListener('selectionchange', ['$event'])
  textareaSelectChange(event: Event) {
    if (this.isComposition) return;
    // イベントのターゲットを HTMLTextAreaElement として扱う
    const thisEvent: HTMLTextAreaElement = event.target as HTMLTextAreaElement;
    if (
      thisEvent.selectionStart <= (this.userInputValue.length ?? 0) ||
      thisEvent.selectionEnd <= (this.userInputValue.length ?? 0)
    ) {
      // カーソルの開始位置を取得する
      this.cursorLocalStart = thisEvent.selectionStart;
      // カーソルの終了位置を取得する
      this.cursorLocalEnd = thisEvent.selectionEnd;
    }
  }

  /**
   * 現在押されているキーを監視するイベントリスナー
   *
   * @param event イベントオブジェクト
   */
  @HostListener('keydown', ['$event'])
  nowKeyDownInput(event: Event) {
    // イベントをキーボードイベントとして扱う
    const nk = event as KeyboardEvent;
    // 押されたキーを保存する
    this.nowKeyDown = nk.key;
    // Ctrl+z または Ctrl+y の場合は、何も処理しない
    if (nk.ctrlKey) {
      this.nowKeyDown = 'Ctrl' + nk.key;
    }
    // Backspace または Delete の場合は、カーソル範囲内の内容を削除する
    if (
      this.nowKeyDown.includes('Backspace') ||
      this.nowKeyDown.includes('Delete')
    ) {
      event.preventDefault();
      this.userInputValue = this.deleteUserInputValue(); // 現在のカーソル範囲の内容を削除する
      this.setCursorValueAndLocal(event);
    }
  }

  /**
   * テキストエリアの切り取りイベントを監視し、現在のカーソル範囲内の内容を削除して、
   * ユーザー入力文字列を更新する
   *
   * @param event イベントオブジェクト
   */
  @HostListener('cut', ['$event'])
  textareaCut(event: Event) {
    // 現在のカーソル範囲の内容を削除する
    this.userInputValue = this.deleteUserInputValue();
    this.setCursorValueAndLocal(event);
  }

  /**
   * 入力イベントハンドラ
   * - 総文字数と各行文字数の制限を適用
   * - 行数制限を適用（必要に応じて切り捨てまたはバリデーション通知）
   */
  @HostListener('input', ['$event'])
  onInput(event: Event) {
    if (this.isComposition) return;
    if ((event as InputEvent).isComposing) {
      return;
    }

    // 今回入力された文字を取得する
    let newChar: string = (event as InputEvent).data ?? ''; // 本次输入的字符
    // Ctrl+z または Ctrl+y の場合は、何も処理しない
    if (
      this.nowKeyDown === 'Ctrlz' ||
      this.nowKeyDown === 'Ctrly' ||
      this.nowKeyDown === 'CtrlBackspace'
    ) {
      // 改行マーカーを改行文字に置き換えてフォームに反映する
      this.setCursorValueAndLocal(event);
    }

    // Enter 以外かつ入力文字が空の場合は処理しない
    if (this.nowKeyDown !== 'Enter' && newChar === '') return;
    // 入力文字を加工・変換する（例：全角→半角など）
    newChar = this.newCharInputProcess(newChar);
    if (this.nowKeyDown === 'Enter') newChar = '\n';

    // 新しい文字を現在のカーソル位置に挿入する
    this.userInputValue = this.insertUserInputValue(newChar);
    this.setCursorValueAndLocal(event);
  }

  /**
   * ユーザーが入力した文字列を処理する。システム専用の改行コードが含まれている場合、それを改行文字に変換する
   *
   * @param str 処理する文字列
   * @returns 処理後の文字列
   */
  private newCharInputProcess(str: string): string {
    // 新しい行マーカーが存在する場合、改行文字に置き換える
    return str.replaceAll(this.newLineMarker, '\n');
  }

  /**
   * ユーザー入力を表示するために処理する
   *
   * @param str 入力された文字列
   * @returns 処理後の文字列。
   */
  private valueShowProcess(str: string = this.userInputValue): string {
    let showStr: string = '';
    let currentLineLength: number = 0;
    for (let i: number = 0; i < str.length; i++) {
      const char: string = str[i] as string;

      // 改行マーカーの場合はスキップ
      if (char === this.newLineMarker) continue;

      // 改行文字の場合、カウンターをリセットし、元の改行を保持
      if (char === '\n') {
        showStr += char;
        currentLineLength = 0;
        continue;
      }

      if (currentLineLength >= this.maxLineLength) {
        showStr += this.newLineMarker;
        this.cursorLocalStart += 1;
        this.cursorLocalEnd = this.cursorLocalStart;
        currentLineLength = 0;
      }

      // 現在の文字を結果に追加
      showStr += char;
      currentLineLength += this.isFullWidth(char) ? 1 : 2;
    }
    return showStr;
  }

  /**
   * ユーザーのカーソル位置に文字を挿入する
   *
   * @param userInputValue ユーザーが入力した内容。デフォルトは現在の入力値（this.userInputValue）
   * @param insertChar 挿入する文字
   */
  private insertUserInputValue(
    insertChar: string,
    uInputValue: string = this.userInputValue
  ): string {
    let start = this.cursorLocalStart;
    let end = this.cursorLocalEnd;
    // カーソル位置の前後の文字列を取得
    const before = uInputValue.substring(0, start);
    const after = uInputValue.substring(end);
    start += insertChar.length;
    end = start;
    this.cursorLocalStart += start;
    this.cursorLocalEnd = end;
    // 新しい文字列を作成して更新
    return this.valueShowProcess(
      (before + insertChar + after).replaceAll(this.newLineMarker, '')
    );
  }

  /**
   * ユーザー入力の文字列から現在のカーソル範囲内の内容を削除し、ユーザー入力を更新する
   * ユーザーが削除または切り取りを行った際、現在のカーソル位置に基づいて文字列を削除する
   */
  private deleteUserInputValue(
    cursorStart: number = this.cursorLocalStart,
    cursorEnd: number = this.cursorLocalEnd
  ): string {
    // カーソルが同じ位置の場合、押されたキーによって削除範囲を調整
    if (this.cursorLocalStart === this.cursorLocalEnd) {
      switch (this.nowKeyDown) {
        case 'Backspace':
          cursorStart = cursorStart - 1 < 0 ? 0 : cursorStart - 1;
          break;
        case 'Delete':
          cursorEnd += 1;
          break;
        default:
          cursorStart = cursorEnd;
      }
    }

    // カーソル位置を基に文字列を前後に分け、削除後の文字列を更新
    const before = this.userInputValue.substring(0, cursorStart);
    const after = this.userInputValue.substring(cursorEnd);
    // カーソル位置を調整
    cursorEnd = cursorStart;
    // 新しいカーソル位置を設定
    this.cursorLocalStart = cursorStart;
    this.cursorLocalEnd = cursorEnd;
    return this.valueShowProcess(
      (before + after).replaceAll(this.newLineMarker, '')
    );
  }

  /**
   * 指定された文字が全角かどうかを判定
   * @param char 対象の文字
   * @returns 全角なら false
   */
  private isFullWidth(char: string): boolean {
    const charCode: number = char.charCodeAt(0);
    return charCode <= 0x7f || (charCode >= 0xff61 && charCode <= 0xff9f);
  }

  private setCursorValueAndLocal(
    ev: Event,
    start: number = this.cursorLocalStart,
    end: number = this.cursorLocalEnd
  ) {
    const textarea = ev?.target as HTMLTextAreaElement;
    this.thisControl.setValue(this.userInputValue);
    textarea.setSelectionRange(this.cursorLocalStart, this.cursorLocalEnd);
  }
}
