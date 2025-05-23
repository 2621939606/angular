// *********************************************************************************
// ファイル名　　：comn01500010-component.ts
// バージョン　　：1.0.0
// 作成日付　　　：2024/12/11
// 作成者　　　　：bsjn.lirui
// 最終更新日付　：2024/12/11
// 更新履歴　　　：2024/12/11： 新規作成
// *********************************************************************************

import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FKeys,
  FormUtil,
  FuncService,
  OnFunc,
  FormMode,
  RouterService,
  TitleUtil,
  ConfirmUtil,
  MessageDialogUtil,
  MessageUtil,
} from '../../../../../fmlib/src/public-api';
import { COMN01500010Service } from './service/comn01500010.service';

import { Search使用状況監視Payload } from './service/search-使用状況監視.payload';

import { COMN01500010Form } from './comn01500010-form';
import { ComnTComnLgnDto } from './service/comntcomnlgn.dto';
import _ from 'lodash';
import { Subscription } from 'rxjs';

/**
 * 使用状況監視Component
 */
@Component({
  selector: 'app-comn01500010',
  templateUrl: './comn01500010.component.html',
  styleUrl: './comn01500010.component.scss',
  providers: [COMN01500010Service],
})
export class COMN01500010Component implements OnInit, OnFunc, OnDestroy {
  /**  使用状況監視Form */
  comn01500010Form: COMN01500010Form = new COMN01500010Form();

  // search params change subscribe
  subscribe?: Subscription;

  // 実際のレスポンスデータ型に変更（any使用禁止）
  /** 一覧データ */
  listData: ComnTComnLgnDto[] = [];

  // 現在の総件数
  currentNumber: string = '';

  // 現在選択されている行のデータ
  currentSelectData: ComnTComnLgnDto | null = null;

  /**
   * コンストラクタ
   */
  constructor(
    private comn01500010Service: COMN01500010Service,
    private funcService: FuncService,
    private routerService: RouterService
  ) {
    // タイトル設定
    TitleUtil.setTitle('使用状況監視');
  }

  ngOnDestroy(): void {
    if (this.subscribe) {
      this.subscribe.unsubscribe();
    }
  }

  /**
   * 初期化処理OnInit
   */
  ngOnInit(): void {
    this.comn01500010Form = new COMN01500010Form();
    // ファンクションキー設定
    this.funcService.setFunctionKey([
      { f: FKeys.F2, title: 'クリア' },

      { f: FKeys.F8, title: '検索' },

      { f: FKeys.F9, title: '削除' },

      { f: FKeys.F12, title: 'メニューへ' },
    ]);
    // UOC START
    FormUtil.setFocus('ユーザid');
    // 初期化ファンクションキー設定
    this.funcService.setEnabledFunc([FKeys.F2, FKeys.F8, FKeys.F12]);
    if (this.subscribe) {
      this.subscribe.unsubscribe();
    }
    this.subscribe = this.comn01500010Form.formGroup.valueChanges.subscribe(
      () => {
        this.listData = [];
        this.currentSelectData = null;
        this.currentNumber = '';
        this.funcService.setEnabledFunc([FKeys.F2, FKeys.F8, FKeys.F12]);
      }
    );
    // UOC END
  }

  /**
   * ファンクションキー処理
   */
  onFunc(key: FKeys, isModal: boolean): void {
    switch (key) {
      case FKeys.F2:
        // UOC START
        if (this.listData == null || this.listData.length <= 0) {
          this.comn01500010Form = new COMN01500010Form();
        } else {
          this.listData = [];
        }
        this.funcService.setEnabledFunc([FKeys.F2, FKeys.F8, FKeys.F12]);
        this.currentNumber = '';
        this.currentSelectData = null;
        FormUtil.setFocus('ユーザid');
        // UOC END
        break;

      case FKeys.F8:
        // UOC START
        // 検索
        this.search使用状況監視();
        // UOC END
        break;

      case FKeys.F9:
        // UOC START
        // 削除
        this.delete使用状況監視();
        // UOC END
        break;

      case FKeys.F12:
        // UOC START
        // メニューへ
        this.routerService.gotoMenu(this.comn01500010Form);
        // UOC END
        break;

      default:
        break;
    }
  }

  /**
   * 検索処理
   */
  public search使用状況監視(): void {
    // UOC START
    // 必須・関連チェックを行う。
    if (this.comn01500010Form.validate()) {
      const data = this.comn01500010Form.toReqDto<Search使用状況監視Payload>();
      console.log(data);
      // 検索APIを呼び出し
      this.comn01500010Service.callSearch使用状況監視Api(data).then(() => {
        // TODO:
        const res = this.comn01500010Service.getSearch使用状況監視Res();
        // 取得データ状況に合わせて登録・更新モード設定
        console.log(res);
        // if (res?.主キー項目を使ってデータ有無チェク) {
        //   this.comn01500010Form.fromDto(res);
        //   this.comn01500010Form.mode = FormMode.UPDATE;
        //   // TODO：データ有りファンクションキー設定
        //   this.funcService.setEnabledFunc([
        //     FKeys.F2,
        //     FKeys.F4,
        //     FKeys.F8,
        //     FKeys.F9,
        //     FKeys.F12,
        //   ]);
        // } else {
        //   this.comn01500010Form.mode = FormMode.NEW;
        //   // TODO：データ無しファンクションキー設定
        //   this.funcService.setEnabledFunc([
        //     FKeys.F2,
        //     FKeys.F4,
        //     FKeys.F8,
        //     FKeys.F12,
        //   ]);
        // }
      });
    }
    // UOC END
  }

  /**
   * delete処理
   */
  public delete使用状況監視(): void {
    // UOC START
    if (this.currentSelectData) {
      ConfirmUtil.confirmDelete().then((confirm) => {
        if (confirm) {
          // delete seleted data
          const payload = this.currentSelectData || {};
          this.comn01500010Service
            .callDelete使用状況監視Api(payload)
            .then(() => {
              this.listData = [];
              this.search使用状況監視();
            });
          this.funcService.setEnabledFunc([
            FKeys.F2,
            FKeys.F8,
            FKeys.F9,
            FKeys.F12,
          ]);
        } else {
          FormUtil.setFocus('ユーザid');
        }
      });
    } else {
      MessageDialogUtil.show([
        {
          message: MessageUtil.getMessage('IE00025'),
        },
      ]);
    }
    // UOC END
  }

  /**
   * レコードの項目データ取得
   */
  public getData(data: any, key: string): any {
    // UOC START

    // 各キーのデフォルト値のマッピングを定義する
    const defaultValues: Record<string, string> = {
      漢字氏名: '?',
      職員番号: '不詳',
      有効期限: '不詳',
      コンピュータ名称: '不詳',
      ログイン日時: '不詳',
      経過時間: '不詳',
    };

    // データ値またはデフォルト値を返す
    return data[key] || data[key] === '' ? data[key] : defaultValues[key] || '';
    // UOC END
  }

  // UOC START
  /**
   * この行が選択されているかどうかを確認する
   * @param data 行のデータ
   * @returns この行が選択されているかどうか
   */
  isRowSelected(data: any) {
    return _.isEqual(this.currentSelectData, data);
  }

  /**
   * 行選択イベントのハンドラー
   * @param data 選択された行のデータ
   */
  selectRow(data: any) {
    if (data != null && data === this.currentSelectData) {
      this.currentSelectData = null;
    } else {
      this.currentSelectData = data;
    }
  }
  // UOC END
}
