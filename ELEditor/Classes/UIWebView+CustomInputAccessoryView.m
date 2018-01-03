#import "UIWebView+CustomInputAccessoryView.h"
#import <objc/runtime.h>

@implementation UIWebView (CustomInputAccessoryView)
    
    static const char * const kCustomInputAccessoryViewClassString = "UIWebBrowserViewCustomAccessoryView";
    static Class kCustomInputAccessoryViewClass = Nil;
    
#pragma mark - Accessors
    
- (void)setCustomInputAccessoryView:(UIView *)customInputAccessoryView
    {
        objc_setAssociatedObject([self browserView], @selector(browserViewCustomInputAccessoryView), customInputAccessoryView, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
        [self loadCustomInputAccessoryView];
    }
    
- (UIView *)customInputAccessoryView
    {
        return objc_getAssociatedObject([self browserView], @selector(customInputAccessoryView));
    }
    
#pragma mark - Browser View Custom Method
    
- (UIView *)browserViewCustomInputAccessoryView
    {
        return objc_getAssociatedObject(self, @selector(browserViewCustomInputAccessoryView));
    }
    
#pragma mark - Helpers
    
- (void)loadCustomInputAccessoryView
    {
        UIView *browserView = [self browserView];
        
        // Register a new class if needed
        if (!kCustomInputAccessoryViewClass) {
            Class newClass = objc_allocateClassPair([browserView class], kCustomInputAccessoryViewClassString, 0);
            IMP newImplementation = [self methodForSelector:@selector(browserViewCustomInputAccessoryView)];
            class_addMethod(newClass, @selector(inputAccessoryView), newImplementation, "@@:");
            objc_registerClassPair(newClass);
            kCustomInputAccessoryViewClass = newClass;
        }
        
        // Switch to the new class if we haven't already
        if ([self class] != kCustomInputAccessoryViewClass) {
            object_setClass(browserView, kCustomInputAccessoryViewClass);
        }
        
        [browserView reloadInputViews];
    }
    
- (UIView *)browserView
    {
        UIScrollView *scrollView = self.scrollView;
        UIView *browserView = nil;
        for (UIView *subview in scrollView.subviews) {
            if ([NSStringFromClass([subview class]) hasPrefix:@"UIWebBrowserView"]) {
                browserView = subview;
                break;
            }
        }
        return browserView;
    }
    
 @end
    
    

@implementation UIWebView (HackishAccessoryHiding)
    
    static const char * const hackishFixClassName = "UIWebBrowserViewMinusAccessoryView";
    static Class hackishFixClass = Nil;
    
- (UIView *)hackishlyFoundBrowserView {
    UIScrollView *scrollView = self.scrollView;
    
    UIView *browserView = nil;
    for (UIView *subview in scrollView.subviews) {
        if ([NSStringFromClass([subview class]) hasPrefix:@"UIWebBrowserView"]) {
            browserView = subview;
            break;
        }
    }
    return browserView;
}
    
- (id)methodReturningNil {
    return nil;
}
    
- (void)ensureHackishSubclassExistsOfBrowserViewClass:(Class)browserViewClass {
    if (!hackishFixClass) {
        Class newClass = objc_allocateClassPair(browserViewClass, hackishFixClassName, 0);
        newClass = objc_allocateClassPair(browserViewClass, hackishFixClassName, 0);
        IMP nilImp = [self methodForSelector:@selector(methodReturningNil)];
        class_addMethod(newClass, @selector(inputAccessoryView), nilImp, "@@:");
        objc_registerClassPair(newClass);
        
        hackishFixClass = newClass;
    }
}
    
- (BOOL) hidesInputAccessoryView {
    UIView *browserView = [self hackishlyFoundBrowserView];
    return [browserView class] == hackishFixClass;
}
    
- (void) setHidesInputAccessoryView:(BOOL)value {
    UIView *browserView = [self hackishlyFoundBrowserView];
    if (browserView == nil) {
        return;
    }
    [self ensureHackishSubclassExistsOfBrowserViewClass:[browserView class]];
    
    if (value) {
        object_setClass(browserView, hackishFixClass);
    }
    else {
        Class normalClass = objc_getClass("UIWebBrowserView");
        object_setClass(browserView, normalClass);
    }
    [browserView reloadInputViews];
}
    
    @end

