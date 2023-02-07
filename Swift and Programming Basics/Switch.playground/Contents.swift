import UIKit

var greeting = "Hello, playground"

//let name = "Cem"
//
//switch name {
//    case "Jessica":
//        print("Hello, Jessica")
//    case "Jane":
//        print("Hello, Jane")
//    default:
//        print("Hello")
//}


//
//let number = 120
//
//switch number {
//    case -100..<0 :
//        print("Ice")
//    case 0..<100:
//        print("Water")
//    case 100..<200:
//        print("Vapor")
//    default:
//        print("Another case")
//}



let point = (0, 2)

switch point {
    case (let x, 0):
        print("on the x-axis with an x value of \(x)")
    case (0, let y):
        print("on the y-axis with a y value of \(y)")
    case let (x, y):
        print("somewhere else at (\(x), \(y))")
}














