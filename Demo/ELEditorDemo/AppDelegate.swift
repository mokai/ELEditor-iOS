//
//  AppDelegate.swift
//  ELEditorDemo
//
//  Created by GKK on 2017/12/7.
//  Copyright © 2017年 Enclave. All rights reserved.
//

import UIKit
import ELEditor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    var isLightTheme = true
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.l
        
        ELEdtiorConfiguration.tintColor = {
            return self.isLightTheme ? UIColor(red:0.251 , green:0.255 , blue:0.275, alpha:1.0) : UIColor(red: 0.604, green: 0.604, blue: 0.604, alpha: 1.0)
        }
        
        ELEdtiorConfiguration.backgroundColor = {
            return self.isLightTheme ? .white : UIColor(red: 0.200, green: 0.200, blue: 0.200, alpha: 1.0)
        }
        
        ELEdtiorConfiguration.borderColor = {
            return self.isLightTheme ?  UIColor.black.withAlphaComponent(0.16) : UIColor(red: 0.318, green: 0.318, blue: 0.318, alpha: 1.0)
        }
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }


}

