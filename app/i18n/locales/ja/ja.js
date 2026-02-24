const ja = {
  upload: {
    title: "ドキュメントをアップロード",
    subtitle: "OCR処理のためにドキュメントをアップロードしてください。",
    dragDrop: {
      title: "ここにファイルをドラッグ＆ドロップ、またはクリックして選択",
      supported: "対応形式: PDF、JPG、PNG、DOCX",
      browse: "ファイルを選択"
    },
    uploadedFiles: "アップロード済みファイル",
    processButton: "OCRで処理",
    processing: "処理中...",
    noFiles: "まだファイルがアップロードされていません。開始するには上にファイルをドロップしてください。",
    howItWorks: {
      title: "使い方",
      step1: {
        title: "アップロード & スキャン",
        desc: "ファイルをドロップすると、Mu OCRが自動的にスキャンします。"
      },
      step2: {
        title: "抽出 & 確認",
        desc: "抽出されたテキストを確認し、必要に応じて修正してください。"
      },
      step3: {
        title: "エクスポート",
        desc: "処理されたデータをさまざまな形式でエクスポートできます。"
      }
    },
    modal: {
      title: "ドキュメントを処理中",
      desc: "テキストを抽出・分析しています。しばらくお待ちください..."
    }
  },
  results: {
    title: "処理結果",
    subtitle: "処理結果をダウンロードできます",
    originalDocument: "元のドキュメント",
    extractedText: "抽出テキスト",
    translatedText: "翻訳テキスト",
    copyText: "テキストをコピー",
    tabularData: "表データ",
    table: {
      item: "項目",
      price: "価格（円）",
      quantity: "数量",
      total: "合計（円）"
    },
    actions: {
      regenerate: "再生成",
      verifyAll: "すべて確認",
      exportExcel: "Excel形式でエクスポート",
      exportPDF: "PDF形式でエクスポート",
      exportText: "テキスト形式でエクスポート",
      newUpload: "新しいファイルをアップロード"
    }
  }
}

export default ja
