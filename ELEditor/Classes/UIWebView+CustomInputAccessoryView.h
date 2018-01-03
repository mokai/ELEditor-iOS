#import <UIKit/UIKit.h>

@interface UIWebView (CustomInputAccessoryView)

/**
 *	@brief		The custom input accessory view.
 */
@property (nonatomic, strong, readwrite) UIView* customInputAccessoryView;


@end


/**
 
 UIWebView modifications for hiding the inputAccessoryView
 
 **/
@interface UIWebView (HackishAccessoryHiding)
    @property (nonatomic, assign) BOOL hidesInputAccessoryView;
    @end
