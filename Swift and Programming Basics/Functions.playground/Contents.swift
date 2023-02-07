import UIKit

//func greet(name: String) -> String {
//    return "Hello, \(name)!"
//}
//
//print("Hello, Jack!")
//
//print(greet(name: "Jack"))
//
//print(greet(name: "Jessica"))


//func addTwoNumbers(a: Int, b: Int) -> Int {
//    return a + b
//}
//
//func multiplyTwoNumbers(a: Int, b: Int) -> Int {
//    return a * b
//}
//
//func divideTwoNumbers(a: Int, b: Int) -> Int {
//    return a / b
//}
//
//func subtractTwoNumbers(a: Int, b: Int) -> Int {
//    return a - b
//}
//
//print(addTwoNumbers(a: 10, b: 5))
//
//print(multiplyTwoNumbers(a: 10, b: 5))
//
//print(divideTwoNumbers(a: 10, b: 5))
//
//print(subtractTwoNumbers(a: 10, b: 5))

//func addTwoNumbers(_ a: Int,_ b: Int) -> Int {
//    return a + b
//}
//
//print(addTwoNumbers(10,5))


//var x = 10
//var y = 5
//
//func swapNumbers(a: inout Int, b: inout Int) {
//    let temporaryA = a
//    a = b
//    b = temporaryA
//}
//
//swapNumbers(a: &x, b: &y)
//
//print(x)
//print(y)


var numbers = [10, 5, 8, 12, 6, 7]

func minMax(array: [Int]) -> (min: Int, max: Int) {
    
    var currentMin = array[0]
    var currentMax = array[0]
    
    for value in array[1..<array.count] {
        if value < currentMin {
            currentMin = value
        }
        else if value > currentMax {
            currentMax = value
        }
    }

    return(currentMin, currentMax)
}

print(minMax(array: numbers))
