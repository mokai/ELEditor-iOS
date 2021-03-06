//
//  ViewController.swift
//  ELEditorDemo
//
//  Created by GKK on 2017/12/7.
//  Copyright © 2017年 Enclave. All rights reserved.
//

import UIKit
import ELEditor

class ViewController: ELEditorViewController, ELEditorViewControllerDelegate {
    
    fileprivate var previewItem: UIBarButtonItem!
    fileprivate var themeItem: UIBarButtonItem!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        delegate = self
        previewItem = UIBarButtonItem(title: "预览", style: .plain, target: self, action: #selector(onPreview(_:)))
        themeItem = UIBarButtonItem(title: "夜间模式", style: .plain, target: self, action: #selector(onSwitchTheme(_:)))
        navigationItem.rightBarButtonItems = [previewItem, themeItem]
    }
    
    @objc func onPreview(_ sender: Any!) {
        let vc = PreviewViewController()
        vc.content = editorView.getContent() ?? ""
        navigationController?.pushViewController(vc, animated: true)
    }
    
    @objc func onSwitchTheme(_ sender: Any!) {
        let delegate = (UIApplication.shared.delegate as! AppDelegate)
        delegate.isLightTheme = !delegate.isLightTheme
        if !delegate.isLightTheme {
            themeItem.title = "日间模式"
            editorView.switchToNightMode()
        } else {
            themeItem.title = "夜间模式"
            editorView.switchToLightMode()
        }
    }
    
    
    func editorViewControllerDidFinishLoadingDOM(_ controller: ELEditorViewController) {
        editorView.setTitle("Hello")
        editorView.setContent("<p class='el-img'><img src='https://photo.enclavebooks.cn/enclave/photo/2018-02-04/12:13:54.jpg'/></p><p>初读《清河县》组诗的续篇，我才发现这一组诗完成于前一组的十二年之后，或者说它的构思和写作延续了十二年之久。读完全篇，我的观感是，每一节诗中的每一行文字都显示出“十年磨一剑”的淬砺和精锐，就我个人读过的现代汉语诗歌而言，至今还很少见过如此令人惊艳的佳作。与前一组诗作间或有生涩费解之处的散漫状况相比，这一组情欲咏叹调的诗性品质显然更加纯粹，特具冲击力。全诗节奏明快，词句洗练，以核心人物放肆的内心独白唱出了一个女人在情欲上薄命、致命和拼命的最强音。<p>潘金莲这个人物自从在《水浒》中登台亮相，几百年来，一直被改写和重写，成为一个文艺母题的富矿，其淫妇形象的艺术再生力与唐璜那种永远的花花公子形象在西方艺坛上的持久影响可谓旗鼓相当，真有那么一拼。唐璜的形象由最初堕落的好色之徒历经改编，逐渐演变成勇于冒险的大众情人，焕发出痴心女子迷恋的浪漫风情。潘金莲的淫妇形象虽经欧阳予倩和魏明伦精心做翻案文章，却终未摆脱被不同改编者作为色情符号推销的角色。近二、三十年来，此角色在媚俗的影视演出中被反复炒作，完全弄成了迎合大众窥淫欲望的视觉消费。</p><p>用诗歌这一特殊的文体改写潘金莲，笔者尚未在朱朱的这组诗作之外读到其它类似的作品。诗歌与小说以及戏剧、影视创作的差异在于它并不把过多的性格描绘和行动当作内在的目标，因而为抒发非情节、非沉思的激情拓展了更加灵动的空间，其传达情欲声音的力度颇接近音乐。这强音动人情思，触发联想，其直接诉诸感兴的韵味更适于反复咏叹，模糊意会，几无咬文嚼字作深度阐释的用武之地。组诗中的潘金莲被改写成一个从故事原型的社会、伦理脉络中蝉蜕出来的情欲发言人，她把她情欲匮乏的苦况一口气怨诅到底，更以情欲受难者的勇气承担起无视善恶正邪之分的罪责，其我行我素的口气一上场即摆出明确的自我定位，预先就排除了拿她作道德批判或色情消费的任何可能。随着诗行的推进，她激越的声音就像作者放出的一架无人机飞入所设定的区域，迎着她遭遇的不同对象，肆意给出她谑浪嘲讽的反应。</p><p>男人的情欲驱动倾向于进犯和更多地占有，女人的情欲接受则有所选择，并非人皆可夫。这一互相配合的趋势有类于动物中经搏斗而赢得交配权的雄性总是要把它的优良基因尽可能多地施与雌性，以利其强势的遗传，而雌性则照例对优胜者的进犯报以迎合，从而把败斗者排斥到局外。所谓男女双方的般配与投合，其实就是从这个生物学的基础上发展起来的。在前现代社会中，妇女的命运基本上取决于婚姻，一个女人一旦受包办买卖婚姻的约束而嫁给不般配的男人，她便锁定在薄命的怨诅中熬其无聊的一生了。正如潘金莲所诉说：“我活着，就像一对孪生的姐妹，/一个长着翅膀，一个拖动镣铐，/一个在织，一个在拆，她们/忙碌在这座又聋又哑的屋檐下。”正是潘金莲形象的这一原型背景造成了她因不甘薄命而拼命去作致命诱惑的恶缘。对不般配的丈夫，她由怨恨而生诅咒，由诅咒而萌杀心，因此她一上场就摆出供认不讳的姿态，以放肆的坦白祭奠她遇害丈夫的亡灵，说什么“我从前的泪水早就为/守灵而滴落……我/这个荡妇，早已在白色的丧服下边，/&nbsp;换好了狂欢的红肚兜。”在朱朱笔下，她甚至以类似于卡门的泼辣和撒野咏叹她那肆意挑衅的放荡，一股子“我要诱惑我怕谁”的气势。特别是针对来自郓哥的刺探监视，以及身边妇女群怀疑和敌视的目光，她均发出反唇相讥的不屑和嘲弄，甚至用以毒攻毒的方式耍弄跟踪她的小密探说：</p><p>大量的现代汉语诗歌作品最不耐读的短处就是充斥芜词累句，很少能贡献出令读者过目成诵的警策佳句。朱朱这组诗作弥补了此常见的缺陷，触处都涌现出可让人反复咏叹的诗行。比如潘金莲回忆她与西门庆打得一片火热的情景是：</p><p>再比如潘金莲怨诅她寡居处境的诗句是：“为纪念一个死者而让所有活着的人/活在阴影里……谁暗中触碰燧石，/谁仿佛就会遭受永生的诅咒。”在这一现不尽之意于言外的慨叹中，读者的反应就不止局限于寡妇对亡夫的怨诅，而有可能联想到危害面更大的阴影。比如某一尚未被彻底清算的罪恶亡灵依旧死而不僵，一片臊气，弄得整个国家和民族都活在其阴影笼罩之下……</p><p>没有围墙隔阻，也就无所谓红杏出墙的诱惑。从某种程度上说，正是囚禁逼出了越轨，看守惹来了偷香。于是防线一旦消失，即使像潘金莲这样的尤物，也再难以“重燃盗火者的激情”。“尤物”本指珍奇之物，用于贬义，则特指美艳而惹祸的女人。“信知尤物必牵情，一顾难酬觉命轻。”（王次回）“夫有尤物，足以移人。”（《左传》）“大凡天之所命尤物也，不妖其身，必妖于人。”（《莺莺传》）就组诗中潘金莲发出的声音来看，要冲破她薄命的困境，也只有持续地发挥她作为尤物的诱惑，才能从施展诱惑的行动中确认她的自我，补偿她的匮乏，从而证实她的价值了。薄命的经历早已侵蚀她的爱心，她承认她“已经不爱任何人”，因此宣称她只爱她“被贪婪地注视，被赤裸地需要。”因此对已经转移“性趣”的西门庆，她仍呼唤道：“来我的身上穷尽所有的女人吧&nbsp;。我的空虚里应有尽有。”因此她大胆炫示她致命的诱惑，自夸说：“我有母马的臀部，足以碾死/每个不餍足的男人”。因此她嘲讽小叔子武松畏缩不前，说他“满身的筋络全是教条而肌肉全是禁区”，还不嫌羞耻地自诉，说她把武松“那根始终勃起的哨棒儿，以往的静夜里/曾经多少次以发烫的面颊紧紧依偎。”面对武松“从不痉挛的道德”，她甚至撒泼耍赖说：“杀了我，否则我就是你杀死的。”对于“被注视、被需要”的际遇，她执著到拼命的地步，以至宁可以被杀的下场赎取她被弃置不顾的现状。</p><p>然而界线、隔阂、障碍、险阻始终把她重重包围，面对“被推远的围墙仍旧是墙”的现实，她走到了跳崖以“殉情欲”的末路。即使在此绝望的一刻，她仍不放弃她致命的努力，对身后的世界发出了最后的怨诅：</p>")
    }

    func editorViewController(_ controller: ELEditorViewController, titleDidChange title: String) {
        if !editorView.isEmptyTitle() {
            print(title)
        }
    }
    
    func editorViewController(_ controller: ELEditorViewController, contentDidChange content: String) {
        if !editorView.isEmptyContent() {
            print(content)
        }
    }
    
}


