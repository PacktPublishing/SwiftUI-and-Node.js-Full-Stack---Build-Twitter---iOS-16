import UIKit

var greeting = "Hello, "
var name = "Jack"

var expression = greeting + name
print(expression)

var a = 8
var b = 3

//a = a + 5
a += 5

print(a % b)

print(a + b)
print(a - b)
print(a / b)
print(a * b)


// Comparison Operators

print(1 == 1)
print(1 != 1)

print(1 > 5)
print(1 < 5)

print(1 <= 5)
print(1 >= 5)


let password = "secretpassword123"

let input = "secretpassword123"

if input == password {
    print("Password approved")
}
else {
    print("Password is not correct")
}


var favoriteFruit = "peaches"

if "apple" == favoriteFruit {
    print("Eat apples")
}
else if "oranges" == favoriteFruit {
    print("Eat oranges")
}
else {
    print("Have whatever you want")
}


var age = 15
var gender = "female"


if gender == "male" && age > 18 {
    print("A team for Men")
}
else if gender == "male" && age < 18 {
    print("B team for Men")
}
else if gender == "female" && age > 18 {
    print("A team for Women")
}
else if gender == "female" && age < 18 {
    print("B team for Women")
}



var height = 185
var weight = 70


if height > 180 || weight > 80 {
    print("Can join team")
}
else {
    print("Does not satisfy the requirements")
}


var isMarried = false

if !isMarried {
    print("Cannot get married")
}
else {
    print("Can get married")
}

















