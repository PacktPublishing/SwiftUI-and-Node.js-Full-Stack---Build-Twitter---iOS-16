import UIKit

var greeting = "Hello, playground"

// Struct

//Class

struct Tree {
    var nofbrances: Int = 40
    var age: Int = 0
    var type: String = ""
    var hasFruits: Bool = false
}

var oak = Tree()
oak.nofbrances = 50
oak.age = 40
oak.type = "Oak"
oak.hasFruits = false


class Car {
    var color: String = ""
    var power: Int = 0
    var numberofdoors: Int = 0
    var brand: String = ""
    var electric: Bool = false
    
    func rew() {
        print("Increase speed")
    }
}

class Tesla_Cars: Car {
    var touchscreenSize: Int = 13
}

var tesla_x = Tesla_Cars()

tesla_x.color = "White"
tesla_x.power = 300
tesla_x.numberofdoors = 4
tesla_x.brand = "Tesla"
tesla_x.electric = true
tesla_x.touchscreenSize = 20

print(tesla_x.color)






