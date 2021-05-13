// Google Chat の WebHookを指定（指定した名前のスレッドで投稿される）
var chat_webhook_url = 'WebHook URLを入れる';
var rss_url = 'https://japan.wordcamp.org/2021/feed/atom'; // RSS (ATOM) の URL を入れる 

function onMessage(){
  // RSSを取得（ATOM用）
  var xml = UrlFetchApp.fetch(rss_url).getContentText();
  var document = XmlService.parse(xml);
  var root = document.getRootElement();
  var atom = XmlService.getNamespace('http://www.w3.org/2005/Atom');
  // 全部取得すると相当数になるので、最新だけ取得する（LIMITE_TIMEで日数指定、ここでは1日以内）
  var NOW_UNIX_TIME = Math.floor((new Date().getTime())/1000);//現在時刻のUnixTime
  var LIMIT_TIME = 24*60*60 * 3;//１日を秒に変換（一番最新のRSSが何日前かで 3の数字を変える）
  var body = "";

  var entries = root.getChildren('entry', atom);
  for (var i = 0; i < entries.length; i++) {
    var updated = new Date(entries[i].getChild('updated', atom).getText());
    var updateUnixTime = Math.floor(updated.getTime()/1000);
    var year		= updated.getFullYear(); //年取得
    var month	= updated.getMonth() + 1;  //月取得　実際の月にするために+1が必要
    var day			= updated.getDate();     // 日取得
    var updated_date = year+"-"+month+"-"+day;
    // 現在の日時（秒）と記事の更新日時（秒）の差をもって、◯日以内の場合のみ記事情報を取得する
    if(NOW_UNIX_TIME - updateUnixTime < LIMIT_TIME ){
      var title = entries[i].getChild('title', atom).getText(); // タイトル情報の取得
      var link = entries[i].getChild('link', atom).getAttribute('href').getValue(); // リンク情報の取得（<link href="リンク情報">）
      var categoryElements = entries[i].getChildren('category', atom); // カテゴリー情報の取得
      var labels = []; // 以下、複数カテゴリー対策
      for (var j = 0; j < categoryElements.length; j++) {
        labels.push(categoryElements[j].getAttribute('term').getValue());
      }
      Logger.log('%s: %s (%s)', updated, title, labels.join(', '));
      // 年-月-日: タイトル名 / リンク（Google Chatではテキストにリンク付与などできないため）
      body += updated_date+":"+title+" / "+link+"\n";
    }
  } 
  // RSS情報があれば、Google Chatへ投稿する処理（post）を実行
  if(body){
    post(body);
  }
}

// Google Chatへ投稿するための POST処理
function post(text){
  // メッセージとスレッドIDを指定
  var payload = {
    "text" : text,
    "thread": {
//      "name": "一度実行し、ログを参考に threadのnameを入れる。ここをコメントアウトすると新規スレッドになる"
    }
  }
  // エンコード
  var json = JSON.stringify(payload);
  // オプション指定
  var options = {
    "method" : "POST",
    "contentType" : 'application/json; charset=utf-8',
    "payload" : json
  }
  // POST実行
  var response = UrlFetchApp.fetch(chat_webhook_url, options);
  // 結果をログ出力しておく
  Logger.log(response);
}