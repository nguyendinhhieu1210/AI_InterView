// services/liveCoding/exampleTemplates.js

const EXAMPLES = {

  // ===== ARRAYS - BEGINNER (2 đề) =====
  arraySumPositive: {
    topic: "Arrays", difficulty: "beginner",
    problemStatement: "Write a function that returns the sum of all positive numbers in an integer array. If the array is empty or has no positive numbers, return 0.",
    functionSignature: `public class Main {\n  public static int sumPositive(int[] arr) {\n    // Your code here\n    // Return sum of all positive numbers\n    // If array is empty or no positives, return 0\n  }\n}`,
    exampleInput: "new int[]{-23, 45, 7, -81, 0, 34}",
    exampleOutput: "86",
    expectedType: "integer",
    testCriteria: "• Return 0 for empty array\n• Return 0 if no positive numbers\n• Return correct sum of positive numbers",
    description: "Sum of all positive numbers in an array"
  },

  arrayCountPositive: {
    topic: "Arrays", difficulty: "beginner",
    problemStatement: "Write a function that counts the number of positive numbers in an integer array. If the array is empty, return 0.",
    functionSignature: `public class Main {\n  public static int countPositive(int[] arr) {\n    // Your code here\n    // Return count of positive numbers\n    // If array is empty, return 0\n  }\n}`,
    exampleInput: "new int[]{-23, 45, 7, -81, 0, 34}",
    exampleOutput: "3",
    expectedType: "integer",
    testCriteria: "• Return 0 for empty array\n• Return correct count of positive numbers\n• Ignore zero and negative numbers",
    description: "Count positive numbers in an array"
  },

  // ===== ARRAYS - INTERMEDIATE (2 đề) =====
  arraySecondLargest: {
    topic: "Arrays", difficulty: "intermediate",
    problemStatement: "Write a function that returns the second largest number in an integer array. Throw an exception if the array has fewer than 2 elements.",
    functionSignature: `public class Main {\n  public static int secondLargest(int[] arr) {\n    // Your code here\n    // Return the second largest number\n    // Throw exception if array has < 2 elements\n  }\n}`,
    exampleInput: "new int[]{10, -20, 30, -40, 50, -10, 20}",
    exampleOutput: "30",
    expectedType: "integer",
    testCriteria: "• Throw exception for array with < 2 elements\n• Handle arrays with duplicate values\n• Return correct second largest",
    description: "Find the second largest number in an array"
  },

  arraySumEven: {
    topic: "Arrays", difficulty: "intermediate",
    problemStatement: "Write a function that returns the sum of all even numbers in an integer array. Return 0 if the array is empty.",
    functionSignature: `public class Main {\n  public static int sumEven(int[] arr) {\n    // Your code here\n    // Return sum of even numbers\n    // If array is empty, return 0\n  }\n}`,
    exampleInput: "new int[]{10, -20, 30, -40, 50, -10, 20}",
    exampleOutput: "40",
    expectedType: "integer",
    testCriteria: "• Return 0 for empty array\n• Handle negative even numbers\n• Return correct sum",
    description: "Sum of even numbers in an array"
  },

  // ===== ARRAYS - ADVANCED (2 đề) =====
  arrayMaxSubarraySum: {
    topic: "Arrays", difficulty: "advanced",
    problemStatement: "Write a function that returns the maximum sum of a contiguous subarray (Kadane's algorithm). If the array is empty, return 0.",
    functionSignature: `public class Main {\n  public static int maxSubarraySum(int[] arr) {\n    // Your code here\n    // Return maximum subarray sum\n    // If array is empty, return 0\n    // Use Kadane's algorithm\n  }\n}`,
    exampleInput: "new int[]{-23, 45, 7, -81, 0, 34, -12, 56, 91, -3, 28, -67}",
    exampleOutput: "194",
    expectedType: "integer",
    testCriteria: "• Return 0 for empty array\n• Handle all negative numbers\n• Handle all positive numbers\n• Return correct max subarray sum",
    description: "Maximum sum of a contiguous subarray"
  },

  arrayTwoSum: {
    topic: "Arrays", difficulty: "advanced",
    problemStatement: "Write a function that finds two numbers in an array that sum to a target value. Return their indices as an array [i, j]. Return [-1, -1] if no pair exists.",
    functionSignature: `public class Main {\n  public static int[] twoSum(int[] arr, int target) {\n    // Your code here\n    // Return indices of two numbers that sum to target\n    // Return [-1, -1] if no pair exists\n  }\n}`,
    exampleInput: "new int[]{2, 7, 11, 15}, 9",
    exampleOutput: "[0, 1]",
    expectedType: "array",
    testCriteria: "• Return [-1, -1] if no pair exists\n• Handle negative numbers\n• Return correct indices\n• O(n) time preferred",
    description: "Find two numbers that sum to a target"
  },

  // ===== COLLECTIONS =====
  collectionsAdvanced: {
    topic: "Collections", difficulty: "advanced",
    problemStatement:
      "Write a Java function that takes an array of integers as input and returns the maximum length of a sublist where the sum of all elements is a multiple of the length of the sublist. If the input array is empty, the function should return 0.",
    functionSignature:
      `public class Main {
  public static int maxSublistLengthMultiple(int[] arr) {
    // Your code here
    // Return the maximum length of a sublist where sum % length == 0
    // If array is empty, return 0
    // Example: [1, 2, 3] -> [1,2,3] sum=6, length=3, 6%3=0 -> return 3
  }
}`,
    exampleInput: "new int[]{14, -27, 0, 45, -13, 91, 34, -3, -67, -81, 28, 56}",
    exampleOutput: "4",
    expectedType: "integer",
    testCriteria:
      "• Handle empty input (return 0)\n• Handle single-element array (return 1 if element % 1 == 0, else 0)\n• Return correct maximum length\n• Optimized solution for large arrays (O(n²) or better)",
    description: "Find maximum sublist length where sum is divisible by length"
  },

  collectionsIntermediate: {
    topic: "Collections", difficulty: "intermediate",
    problemStatement:
      "Write a Java function that takes an array of integers and converts it to a List, then returns the sum of all even numbers in the List. If the List is empty, throw an exception. If the List has only one element, return that element if it's even, otherwise return 0.",
    functionSignature:
      `import java.util.*;
public class Main {
  public static int sumEvenNumbers(int[] arr) {
    // Your code here
    // Convert array to List, filter even numbers, return sum
  }
}`,
    exampleInput: "new int[]{14, -27, 0, 53, -81, 34, -12, 56}",
    exampleOutput: "92",
    expectedType: "integer",
    testCriteria:
      "• Handle empty input by throwing exception\n• Handle single-element array correctly\n• Return correct sum of even numbers",
    description: "Sum of even numbers in an array"
  },

  collectionsBeginner: {
    topic: "Collections", difficulty: "beginner",
    problemStatement:
      "Write a Java function that takes an array of integers and converts it to a List, then returns the count of elements in the List that are greater than the average of all elements. If the array is empty, throw an exception.",
    functionSignature:
      `import java.util.*;
public class Main {
  public static int countGreaterThanAverage(int[] arr) {
    // Your code here
    // Convert array to List, calculate average, count elements > average
  }
}`,
    exampleInput: "new int[]{34, -46, 6, 81, 0, -34, 12, 56}",
    exampleOutput: "3",
    expectedType: "integer",
    testCriteria:
      "• Handle empty input by throwing exception\n• Return correct count of elements above average\n• Handle arrays with all elements below or equal to average\n• Handle arrays with all elements above average",
    description: "Count elements greater than average"
  },
  

  // ===== OBJECT - ABSTRACT CLASS =====
  objectAbstractAdvanced: {
    topic: "Object - Abstract Class", difficulty: "advanced",
    problemStatement:
      "Create an abstract class 'Vehicle' with abstract method 'calculateDistance()'. Create two concrete subclasses 'Car' and 'Truck' that extend Vehicle. Each subclass should implement calculateDistance() as speed * time. Validate that speed and time are positive. Calculate total distance for an array of vehicles.",
    functionSignature:
      `abstract class Vehicle {
  protected double speed;
  protected double time;
  
  public Vehicle(double speed, double time) {
    if (speed <= 0 || time <= 0) 
      throw new IllegalArgumentException("Speed and time must be positive");
    this.speed = speed;
    this.time = time;
  }
  
  public abstract double calculateDistance();
}

class Car extends Vehicle {
  public Car(double speed, double time) {
    super(speed, time);
  }
  @Override
  public double calculateDistance() {
    return speed * time;
  }
}

class Truck extends Vehicle {
  public Truck(double speed, double time) {
    super(speed, time);
  }
  @Override
  public double calculateDistance() {
    return speed * time;
  }
}`,
    exampleInput: "new Vehicle[]{ new Car(50, 2), new Truck(40, 3) }",
    exampleOutput: "220.0",
    expectedType: "double",
    testCriteria:
      "• Abstract class with abstract method\n• Concrete subclasses extend abstract class\n• Implement abstract method in subclasses\n• Validate constructor inputs (positive values)\n• Use polymorphism to calculate total",
    description: "Abstract class with inheritance and polymorphism"
  },

  objectAbstractIntermediate: {
    topic: "Object - Abstract Class", difficulty: "intermediate",
    problemStatement:
      "Create an abstract class 'Shape' with abstract method 'calculateArea()'. Create two concrete subclasses 'Circle' and 'Rectangle' that extend Shape. Each subclass should implement calculateArea() with the correct formula. Validate that all dimensions are positive.",
    functionSignature:
      `abstract class Shape {
  public abstract double calculateArea();
}

class Circle extends Shape {
  private double radius;
  public Circle(double radius) {
    if (radius <= 0) throw new IllegalArgumentException("Radius must be positive");
    this.radius = radius;
  }
  @Override
  public double calculateArea() {
    return Math.PI * radius * radius;
  }
}

class Rectangle extends Shape {
  private double width, height;
  public Rectangle(double width, double height) {
    if (width <= 0 || height <= 0) 
      throw new IllegalArgumentException("Dimensions must be positive");
    this.width = width;
    this.height = height;
  }
  @Override
  public double calculateArea() {
    return width * height;
  }
}`,
    exampleInput: "new Shape[]{ new Circle(5), new Rectangle(4, 6) }",
    exampleOutput: "102.54",
    expectedType: "double",
    testCriteria:
      "• Abstract class with abstract method\n• Concrete subclasses extend abstract class\n• Implement abstract method in subclasses\n• Validate constructor inputs\n• Calculate total area using polymorphism",
    description: "Abstract class with area calculation"
  },

  objectAbstractBeginner: {
    topic: "Object - Abstract Class", difficulty: "beginner",
    problemStatement:
      "Create an abstract class 'Animal' with abstract method 'makeSound()'. Create a concrete subclass 'Dog' that extends Animal and implements makeSound() to return 'Woof!'. Validate that name is not empty.",
    functionSignature:
      `abstract class Animal {
  protected String name;
  public Animal(String name) {
    if (name == null || name.isEmpty()) 
      throw new IllegalArgumentException("Name cannot be empty");
    this.name = name;
  }
  public abstract String makeSound();
}

class Dog extends Animal {
  public Dog(String name) {
    super(name);
  }
  @Override
  public String makeSound() {
    return "Woof!";
  }
}`,
    exampleInput: "new Dog(\"Buddy\")",
    exampleOutput: "\"Woof!\"",
    expectedType: "string",
    testCriteria:
      "• Abstract class with abstract method\n• Concrete subclass extends abstract class\n• Implement abstract method\n• Validate constructor input",
    description: "Basic abstract class implementation"
  },

  // ===== OBJECT - INTERFACE =====
  objectInterfaceAdvanced: {
    topic: "Object - Interface", difficulty: "advanced",
    problemStatement:
      "Create an interface 'Drawable' with method 'draw()'. Create interface 'Resizable' with method 'resize(double factor)'. Create class 'Circle' that implements both interfaces. Implement draw() to print circle info and resize() to change radius. Validate radius is positive.",
    functionSignature:
      `interface Drawable {
  void draw();
}

interface Resizable {
  void resize(double factor);
}

class Circle implements Drawable, Resizable {
  private double radius;
  
  public Circle(double radius) {
    if (radius <= 0) throw new IllegalArgumentException("Radius must be positive");
    this.radius = radius;
  }
  
  @Override
  public void draw() {
    System.out.println("Drawing Circle with radius " + radius);
  }
  
  @Override
  public void resize(double factor) {
    if (factor <= 0) throw new IllegalArgumentException("Factor must be positive");
    radius *= factor;
  }
  
  public double getRadius() { return radius; }
}`,
    exampleInput: "new Circle(5)",
    exampleOutput: "\"Drawing Circle with radius 5.0\"",
    expectedType: "string",
    testCriteria:
      "• Define interface with abstract methods\n• Class implements multiple interfaces\n• Implement all interface methods\n• Validate constructor inputs\n• Demonstrate polymorphism through interfaces",
    description: "Multiple interfaces implementation"
  },

  objectInterfaceIntermediate: {
    topic: "Object - Interface", difficulty: "intermediate",
    problemStatement:
      "Create an interface 'Payable' with method 'calculatePay()'. Create two classes 'Employee' and 'Freelancer' that implement Payable. Employee calculates pay as salary/12 per month. Freelancer calculates pay as hourlyRate * hoursWorked. Validate inputs are positive.",
    functionSignature:
      `interface Payable {
  double calculatePay();
}

class Employee implements Payable {
  private double annualSalary;
  public Employee(double annualSalary) {
    if (annualSalary <= 0) throw new IllegalArgumentException("Salary must be positive");
    this.annualSalary = annualSalary;
  }
  @Override
  public double calculatePay() {
    return annualSalary / 12; // Monthly pay
  }
}

class Freelancer implements Payable {
  private double hourlyRate;
  private int hoursWorked;
  public Freelancer(double hourlyRate, int hoursWorked) {
    if (hourlyRate <= 0 || hoursWorked <= 0) 
      throw new IllegalArgumentException("Rate and hours must be positive");
    this.hourlyRate = hourlyRate;
    this.hoursWorked = hoursWorked;
  }
  @Override
  public double calculatePay() {
    return hourlyRate * hoursWorked;
  }
}`,
    exampleInput: "new Payable[]{ new Employee(60000), new Freelancer(50, 40) }",
    exampleOutput: "7000.0",
    expectedType: "double",
    testCriteria:
      "• Interface with abstract method\n• Multiple classes implement interface\n• Implement calculatePay correctly\n• Validate constructor inputs\n• Use polymorphism through interface",
    description: "Interface implementation for payment calculation"
  },

  objectInterfaceBeginner: {
    topic: "Object - Interface", difficulty: "beginner",
    problemStatement:
      "Create an interface 'Printable' with method 'print()'. Create a class 'Document' that implements Printable. The print() method should return the document content. Validate content is not empty.",
    functionSignature:
      `interface Printable {
  String print();
}

class Document implements Printable {
  private String content;
  public Document(String content) {
    if (content == null || content.isEmpty()) 
      throw new IllegalArgumentException("Content cannot be empty");
    this.content = content;
  }
  @Override
  public String print() {
    return content;
  }
}`,
    exampleInput: "new Document(\"Hello World\")",
    exampleOutput: "\"Hello World\"",
    expectedType: "string",
    testCriteria:
      "• Interface with abstract method\n• Class implements interface\n• Implement print() method\n• Validate constructor input",
    description: "Basic interface implementation"
  },

  // ===== OBJECT - POLYMORPHISM =====
  objectPolymorphismAdvanced: {
    topic: "Object - Polymorphism", difficulty: "advanced",
    problemStatement:
      "Create a base class 'Animal' with method 'speak()'. Create subclasses 'Dog', 'Cat', and 'Cow' that override speak() with their own sounds. Create a method that takes an array of Animals and returns a concatenated string of all sounds.",
    functionSignature:
      `class Animal {
  public String speak() {
    return "Some sound";
  }
}

class Dog extends Animal {
  @Override
  public String speak() {
    return "Woof!";
  }
}

class Cat extends Animal {
  @Override
  public String speak() {
    return "Meow!";
  }
}

class Cow extends Animal {
  @Override
  public String speak() {
    return "Moo!";
  }
}

public class Main {
  public static String allSpeak(Animal[] animals) {
    StringBuilder result = new StringBuilder();
    for (Animal animal : animals) {
      result.append(animal.speak()).append(" ");
    }
    return result.toString().trim();
  }
}`,
    exampleInput: "new Animal[]{ new Dog(), new Cat(), new Cow() }",
    exampleOutput: "\"Woof! Meow! Moo!\"",
    expectedType: "string",
    testCriteria:
      "• Base class with method to override\n• Subclasses override method\n• Demonstrate polymorphism\n• Handle array of parent type with child objects",
    description: "Polymorphism with animal sounds"
  },

  objectPolymorphismIntermediate: {
    topic: "Object - Polymorphism", difficulty: "intermediate",
    problemStatement:
      "Create a base class 'Shape' with method 'getArea()'. Create subclasses 'Circle', 'Rectangle', and 'Triangle' that override getArea() with their own formulas. Create a method that takes an array of Shapes and returns the total area.",
    functionSignature:
      `class Shape {
  public double getArea() {
    return 0.0;
  }
}

class Circle extends Shape {
  private double radius;
  public Circle(double radius) {
    if (radius <= 0) throw new IllegalArgumentException("Radius must be positive");
    this.radius = radius;
  }
  @Override
  public double getArea() {
    return Math.PI * radius * radius;
  }
}

class Rectangle extends Shape {
  private double width, height;
  public Rectangle(double width, double height) {
    if (width <= 0 || height <= 0) 
      throw new IllegalArgumentException("Dimensions must be positive");
    this.width = width;
    this.height = height;
  }
  @Override
  public double getArea() {
    return width * height;
  }
}`,
    exampleInput: "new Shape[]{ new Circle(5), new Rectangle(4, 6) }",
    exampleOutput: "102.54",
    expectedType: "double",
    testCriteria:
      "• Base class with method to override\n• Subclasses override method\n• Validate constructor inputs\n• Demonstrate polymorphism",
    description: "Polymorphism with shape areas"
  },

  // ===== OBJECT - INHERITANCE =====
  objectInheritanceAdvanced: {
    topic: "Object - Inheritance", difficulty: "advanced",
    problemStatement:
      "Create a base class 'BankAccount' with fields accountNumber, ownerName, balance. Include deposit, withdraw, and getBalance methods. Create 'SavingsAccount' subclass that adds interestRate and addInterest() method. Validate all inputs.",
    functionSignature:
      `class BankAccount {
  protected String accountNumber;
  protected String ownerName;
  protected double balance;
  
  public BankAccount(String accountNumber, String ownerName, double balance) {
    if (accountNumber == null || accountNumber.isEmpty()) 
      throw new IllegalArgumentException("Account number required");
    if (ownerName == null || ownerName.isEmpty()) 
      throw new IllegalArgumentException("Owner name required");
    if (balance < 0) throw new IllegalArgumentException("Balance cannot be negative");
    this.accountNumber = accountNumber;
    this.ownerName = ownerName;
    this.balance = balance;
  }
  
  public void deposit(double amount) {
    if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");
    balance += amount;
  }
  
  public void withdraw(double amount) {
    if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");
    if (amount > balance) throw new IllegalArgumentException("Insufficient balance");
    balance -= amount;
  }
  
  public double getBalance() { return balance; }
}

class SavingsAccount extends BankAccount {
  private double interestRate;
  
  public SavingsAccount(String accountNumber, String ownerName, 
                        double balance, double interestRate) {
    super(accountNumber, ownerName, balance);
    if (interestRate <= 0) throw new IllegalArgumentException("Interest rate must be positive");
    this.interestRate = interestRate;
  }
  
  public void addInterest() {
    balance += balance * interestRate;
  }
}`,
    exampleInput: "new SavingsAccount(\"SAV-123\", \"John Doe\", 1000, 0.05)",
    exampleOutput: "\"Account: SAV-123 | Owner: John Doe | Balance: 1050.00\"",
    expectedType: "string",
    testCriteria:
      "• Inheritance with extends\n• Super constructor call\n• Method overriding\n• Private fields with encapsulation\n• Input validation",
    description: "Bank account with inheritance"
  },

  objectInheritanceIntermediate: {
    topic: "Object - Inheritance", difficulty: "intermediate",
    problemStatement:
      "Create a base class 'Employee' with fields name, salary. Include getDetails() method. Create 'Manager' subclass that adds department and bonus. Override getDetails() to include department and bonus info.",
    functionSignature:
      `class Employee {
  protected String name;
  protected double salary;
  
  public Employee(String name, double salary) {
    if (name == null || name.isEmpty()) 
      throw new IllegalArgumentException("Name required");
    if (salary < 0) throw new IllegalArgumentException("Salary cannot be negative");
    this.name = name;
    this.salary = salary;
  }
  
  public String getDetails() {
    return "Employee: " + name + ", Salary: $" + salary;
  }
}

class Manager extends Employee {
  private String department;
  private double bonus;
  
  public Manager(String name, double salary, String department, double bonus) {
    super(name, salary);
    if (department == null || department.isEmpty()) 
      throw new IllegalArgumentException("Department required");
    if (bonus < 0) throw new IllegalArgumentException("Bonus cannot be negative");
    this.department = department;
    this.bonus = bonus;
  }
  
  @Override
  public String getDetails() {
    return super.getDetails() + ", Department: " + department + 
           ", Bonus: $" + bonus;
  }
}`,
    exampleInput: "new Manager(\"Alice\", 75000, \"IT\", 5000)",
    exampleOutput: "\"Employee: Alice, Salary: $75000.0, Department: IT, Bonus: $5000.0\"",
    expectedType: "string",
    testCriteria:
      "• Inheritance with extends\n• Super constructor call\n• Method overriding with @Override\n• Input validation\n• Access parent method with super",
    description: "Employee manager with inheritance"
  },

  objectInheritanceBeginner: {
    topic: "Object - Inheritance", difficulty: "beginner",
    problemStatement:
      "Create a base class 'Vehicle' with fields brand, year. Include getInfo() method. Create 'Car' subclass that adds model. Override getInfo() to include model.",
    functionSignature:
      `class Vehicle {
  protected String brand;
  protected int year;
  
  public Vehicle(String brand, int year) {
    if (brand == null || brand.isEmpty()) 
      throw new IllegalArgumentException("Brand required");
    if (year < 1886 || year > 2026) 
      throw new IllegalArgumentException("Invalid year");
    this.brand = brand;
    this.year = year;
  }
  
  public String getInfo() {
    return brand + " (" + year + ")";
  }
}

class Car extends Vehicle {
  private String model;
  
  public Car(String brand, int year, String model) {
    super(brand, year);
    if (model == null || model.isEmpty()) 
      throw new IllegalArgumentException("Model required");
    this.model = model;
  }
  
  @Override
  public String getInfo() {
    return super.getInfo() + " - " + model;
  }
}`,
    exampleInput: "new Car(\"Toyota\", 2020, \"Camry\")",
    exampleOutput: "\"Toyota (2020) - Camry\"",
    expectedType: "string",
    testCriteria:
      "• Inheritance with extends\n• Super constructor call\n• Method overriding\n• Basic validation",
    description: "Basic inheritance with vehicle and car"
  },

  // ===== ARRAYS =====
  arrayAdvanced: {
    topic: "Arrays", difficulty: "advanced",
    problemStatement:
      "Write a function `findMaxMinDiff` that takes an integer array and returns the difference between its maximum and minimum values. Throw an exception if the array is empty.",
    functionSignature:
      `public class Main {
  public static int findMaxMinDiff(int[] arr) {
    // Your code here
  }
}`,
    exampleInput: "[10, -20, 30, -40, 50, -10, 20, 0, 5, -5, 15]",
    exampleOutput: "90",
    expectedType: "integer",
    testCriteria:
      "• Throw exception for empty array\n• Handle single-element array (return 0)\n• Return max - min correctly",
    description: "Find the difference between max and min values in an array"
  },

  arrayIntermediate: {
    topic: "Arrays", difficulty: "intermediate",
    problemStatement:
      "Write a function `findMax` that returns the maximum value in an integer array. Throw an exception if the array is empty.",
    functionSignature:
      `public class Main {
  public static int findMax(int[] arr) {
    // Your code here
  }
}`,
    exampleInput: "[10, 20, -30, 40, -50, 15, 5]",
    exampleOutput: "40",
    expectedType: "integer",
    testCriteria:
      "• Throw exception for empty array\n• Handle single-element array\n• Handle all-negative array\n• Return maximum value",
    description: "Find the maximum value in an array"
  },

  arrayBeginner: {
    topic: "Arrays", difficulty: "beginner",
    problemStatement:
      "Write a function `sumArray` that returns the sum of all elements in an integer array. Return 0 for an empty array.",
    functionSignature:
      `public class Main {
  public static int sumArray(int[] arr) {
    // Your code here
  }
}`,
    exampleInput: "[10, 20, 30, 40, 50]",
    exampleOutput: "150",
    expectedType: "integer",
    testCriteria:
      "• Return 0 for empty array\n• Handle negative numbers\n• Return correct sum",
    description: "Calculate the sum of all elements in an array"
  },

  // ===== SORTING =====
  sortingAdvanced: {
    topic: "Sorting", difficulty: "advanced",
    problemStatement:
      "Implement Merge Sort to sort an integer array in ascending order. Return the sorted array; return an empty array if input is empty.",
    functionSignature:
      `public class Main {
  public static int[] mergeSort(int[] arr) {
    // Your code here
  }
}`,
    exampleInput: "[10, -20, 30, -40, 50, -10, 20, 0, 5, -5, 15]",
    exampleOutput: "[-40, -20, -10, -5, 0, 5, 10, 15, 20, 30, 50]",
    expectedType: "array",
    testCriteria:
      "• Return empty array for empty input\n• Handle single-element array\n• O(n log n) time complexity\n• Sort in ascending order",
    description: "Sort array using Merge Sort"
  },

  sortingIntermediate: {
    topic: "Sorting", difficulty: "intermediate",
    problemStatement:
      "Implement Quick Sort to sort an integer array in ascending order. Return the sorted array; return an empty array if input is empty.",
    functionSignature:
      `public class Main {
  public static int[] quickSort(int[] arr) {
    // Your code here
  }
}`,
    exampleInput: "[10, -20, 30, -40, 50, -10, 20]",
    exampleOutput: "[-40, -20, -10, 10, 20, 30, 50]",
    expectedType: "array",
    testCriteria:
      "• Return empty array for empty input\n• Handle single-element array\n• O(n log n) average time complexity\n• Sort in ascending order",
    description: "Sort array using Quick Sort"
  },

  sortingBeginner: {
    topic: "Sorting", difficulty: "beginner",
    problemStatement:
      "Implement Bubble Sort to sort an integer array in ascending order. Return the sorted array; return an empty array if input is empty.",
    functionSignature:
      `public class Main {
  public static int[] bubbleSort(int[] arr) {
    // Your code here
  }
}`,
    exampleInput: "[10, -20, 30, -40, 50]",
    exampleOutput: "[-40, -20, 10, 30, 50]",
    expectedType: "array",
    testCriteria:
      "• Return empty array for empty input\n• Handle single-element array\n• Sort in ascending order",
    description: "Sort array using Bubble Sort"
  },

  // ===== QUEUE =====
  queueAdvanced: {
    topic: "Queue", difficulty: "advanced",
    problemStatement:
      "Write a method `findMax` that returns the maximum value in a Queue<Integer>. The queue must remain unchanged after the call. Throw an exception if the queue is empty.",
    functionSignature:
      `import java.util.*;

public class Main {
  public static int findMax(Queue<Integer> queue) {
    // Your code here
  }
}`,
    exampleInput: "new LinkedList<>(Arrays.asList(-8, 10, -2, 74, 46))",
    exampleOutput: "74",
    expectedType: "integer",
    testCriteria:
      "• Use only offer(), poll(), peek()\n• Queue must be unchanged after the call\n• Throw exception for empty queue\n• Return maximum value",
    description: "Find the maximum element in a Queue"
  },

  queueIntermediate: {
    topic: "Queue", difficulty: "intermediate",
    problemStatement:
      "Write a method `sumQueue` that returns the sum of all elements in a Queue<Integer>. The queue must remain unchanged after the call. Return 0 if the queue is empty.",
    functionSignature:
      `import java.util.*;

public class Main {
  public static int sumQueue(Queue<Integer> queue) {
    // Your code here
  }
}`,
    exampleInput: "new LinkedList<>(Arrays.asList(-8, 10, -2, 74, 46))",
    exampleOutput: "120",
    expectedType: "integer",
    testCriteria:
      "• Use only offer(), poll(), peek()\n• Queue must be unchanged after the call\n• Return 0 for empty queue\n• Return correct sum",
    description: "Calculate the sum of all elements in a Queue"
  },

  queueBeginner: {
    topic: "Queue", difficulty: "beginner",
    problemStatement:
      "Write a method `peekFront` that returns the front element of a Queue<Integer> without removing it. Return null if the queue is empty.",
    functionSignature:
      `import java.util.*;

public class Main {
  public static Integer peekFront(Queue<Integer> queue) {
    // Your code here
  }
}`,
    exampleInput: "new LinkedList<>(Arrays.asList(5, 10, 15))",
    exampleOutput: "5",
    expectedType: "integer",
    testCriteria:
      "• Use peek() — do not remove the element\n• Queue must be unchanged after the call\n• Return null for empty queue",
    description: "Peek at the front element of a Queue"
  },

  // ===== STACK =====
  stackAdvanced: {
    topic: "Stack", difficulty: "advanced",
    problemStatement:
      "Write a method `findMin` that returns the minimum value in a Stack<Integer>. The stack must remain unchanged after the call. Throw an exception if the stack is empty.",
    functionSignature:
      `import java.util.*;

public class Main {
  public static int findMin(Stack<Integer> stack) {
    // Your code here
  }
}`,
    exampleInput: "new Stack<Integer>() {{ push(10); push(-2); push(74); push(46); push(-8); }}",
    exampleOutput: "-8",
    expectedType: "integer",
    testCriteria:
      "• Use only push(), pop(), peek()\n• Stack must be unchanged after the call\n• Throw exception for empty stack\n• Return minimum value",
    description: "Find the minimum element in a Stack"
  },

  stackIntermediate: {
    topic: "Stack", difficulty: "intermediate",
    problemStatement:
      "Write a method `sumStack` that returns the sum of all elements in a Stack<Integer>. The stack must remain unchanged after the call. Return 0 if the stack is empty.",
    functionSignature:
      `import java.util.*;

public class Main {
  public static int sumStack(Stack<Integer> stack) {
    // Your code here
  }
}`,
    exampleInput: "new Stack<Integer>() {{ push(10); push(-2); push(74); push(46); }}",
    exampleOutput: "128",
    expectedType: "integer",
    testCriteria:
      "• Use only push(), pop(), peek()\n• Stack must be unchanged after the call\n• Return 0 for empty stack\n• Return correct sum",
    description: "Calculate the sum of all elements in a Stack"
  },

  stackBeginner: {
    topic: "Stack", difficulty: "beginner",
    problemStatement:
      "Write a method `getTop` that returns the top element of a Stack<Integer> without removing it. Return null if the stack is empty.",
    functionSignature:
      `import java.util.*;

public class Main {
  public static Integer getTop(Stack<Integer> stack) {
    // Your code here
  }
}`,
    exampleInput: "new Stack<Integer>() {{ push(10); push(20); push(30); }}",
    exampleOutput: "30",
    expectedType: "integer",
    testCriteria:
      "• Use peek() — do not remove the element\n• Stack must be unchanged after the call\n• Return null for empty stack",
    description: "Peek at the top element of a Stack"
  },

  // ===== STRINGS =====
  stringAdvanced: {
    topic: "Strings", difficulty: "advanced",
    problemStatement:
      "Write a function `isPalindrome` that returns true if the input string is a palindrome. Ignore case and all non-alphanumeric characters. Return true for an empty string.",
    functionSignature:
      `public class Main {
  public static boolean isPalindrome(String s) {
    // Your code here
  }
}`,
    exampleInput: "\"A man, a plan, a canal: Panama\"",
    exampleOutput: "true",
    expectedType: "boolean",
    testCriteria:
      "• Ignore case\n• Ignore non-alphanumeric characters\n• Return true for empty string\n• Return true for single character",
    description: "Check if a string is a palindrome"
  },

  stringIntermediate: {
    topic: "Strings", difficulty: "intermediate",
    problemStatement:
      "Write a function `countVowels` that counts the number of vowels (a, e, i, o, u) in a string. The check is case-insensitive. Return 0 for an empty string.",
    functionSignature:
      `public class Main {
  public static int countVowels(String s) {
    // Your code here
  }
}`,
    exampleInput: "\"Hello World\"",
    exampleOutput: "3",
    expectedType: "integer",
    testCriteria:
      "• Case-insensitive (count both upper and lower)\n• Return 0 for empty string\n• Count only a, e, i, o, u",
    description: "Count vowels in a string"
  },

  stringBeginner: {
    topic: "Strings", difficulty: "beginner",
    problemStatement:
      "Write a function `reverseString` that returns the reverse of the input string. Return an empty string if input is empty.",
    functionSignature:
      `public class Main {
  public static String reverseString(String s) {
    // Your code here
  }
}`,
    exampleInput: "\"hello\"",
    exampleOutput: "\"olleh\"",
    expectedType: "string",
    testCriteria:
      "• Return empty string for empty input\n• Handle single-character string\n• Return correctly reversed string",
    description: "Reverse a string"
  },

  // ===== MATH =====
  mathAdvanced: {
    topic: "Math", difficulty: "advanced",
    problemStatement:
      "Write a function `fibonacci` that returns the nth Fibonacci number (F(0) = 0, F(1) = 1). Use memoization. Throw an exception for negative input.",
    functionSignature:
      `public class Main {
  public static long fibonacci(int n) {
    // Your code here
  }
}`,
    exampleInput: "10",
    exampleOutput: "55",
    expectedType: "integer",
    testCriteria:
      "• F(0) = 0, F(1) = 1\n• Throw exception for n < 0\n• Use memoization — O(n) time\n• Return correct Fibonacci number",
    description: "Nth Fibonacci number with memoization"
  },

  mathIntermediate: {
    topic: "Math", difficulty: "intermediate",
    problemStatement:
      "Write a function `factorial` that returns n! (0! = 1). Throw an exception for negative input.",
    functionSignature:
      `public class Main {
  public static long factorial(int n) {
    // Your code here
  }
}`,
    exampleInput: "5",
    exampleOutput: "120",
    expectedType: "integer",
    testCriteria:
      "• 0! = 1, 1! = 1\n• Throw exception for n < 0\n• Return correct factorial",
    description: "Calculate n factorial"
  },

  mathBeginner: {
    topic: "Math", difficulty: "beginner",
    problemStatement:
      "Write a function `isPrime` that returns true if n is a prime number, false otherwise. Numbers less than 2 are not prime.",
    functionSignature:
      `public class Main {
  public static boolean isPrime(int n) {
    // Your code here
  }
}`,
    exampleInput: "7",
    exampleOutput: "true",
    expectedType: "boolean",
    testCriteria:
      "• Return false for n < 2\n• Handle negative numbers (return false)\n• Check divisibility up to sqrt(n)\n• Return true only for prime numbers",
    description: "Check if a number is prime"
  }
};

// ========== GET EXAMPLE BY TOPIC AND DIFFICULTY ==========
function getExampleForTopic(topic, language, difficulty) {
  const t = topic.toLowerCase();
  const d = difficulty.toLowerCase();

  // ===== OBJECT (OOP) - ENHANCED =====
  if (t.includes("object") || t.includes("oop") || t.includes("class") || 
      t.includes("inheritance") || t.includes("polymorphism") || 
      t.includes("abstract") || t.includes("interface")) {
    
    // Abstract class
    if (t.includes("abstract")) {
      if (d === "advanced") return EXAMPLES.objectAbstractAdvanced;
      if (d === "intermediate") return EXAMPLES.objectAbstractIntermediate;
      return EXAMPLES.objectAbstractBeginner;
    }
    
    // Interface
    if (t.includes("interface")) {
      if (d === "advanced") return EXAMPLES.objectInterfaceAdvanced;
      if (d === "intermediate") return EXAMPLES.objectInterfaceIntermediate;
      return EXAMPLES.objectInterfaceBeginner;
    }
    
    // Polymorphism
    if (t.includes("polymorphism")) {
      if (d === "advanced") return EXAMPLES.objectPolymorphismAdvanced;
      return EXAMPLES.objectPolymorphismIntermediate;
    }
    
    // Inheritance
    if (t.includes("inheritance") || t.includes("extends")) {
      if (d === "advanced") return EXAMPLES.objectInheritanceAdvanced;
      if (d === "intermediate") return EXAMPLES.objectInheritanceIntermediate;
      return EXAMPLES.objectInheritanceBeginner;
    }
    
    // Default OOP
    if (d === "advanced") return EXAMPLES.objectInheritanceAdvanced;
    if (d === "intermediate") return EXAMPLES.objectInheritanceIntermediate;
    return EXAMPLES.objectInheritanceBeginner;
  }

  // ===== COLLECTIONS =====
  if (t.includes("collection") || t.includes("collections") || 
      t.includes("list") || t.includes("arraylist") || t.includes("linkedlist")) {
    if (d === "advanced") return EXAMPLES.collectionsAdvanced;
    if (d === "intermediate") return EXAMPLES.collectionsIntermediate;
    return EXAMPLES.collectionsBeginner;
  }

  // ===== ARRAYS =====
if (t.includes("array")) {
  // Beginner
  if (d === "beginner") {
    if (t.includes("positive") || t.includes("sum positive")) 
      return EXAMPLES.arraySumPositive;
    if (t.includes("count positive") || t.includes("countpositive")) 
      return EXAMPLES.arrayCountPositive;
    return EXAMPLES.arrayBeginner; // fallback: sum all elements
  }
  
  // Intermediate
  if (d === "intermediate") {
    if (t.includes("second largest") || t.includes("secondlargest")) 
      return EXAMPLES.arraySecondLargest;
    if (t.includes("even") && t.includes("sum")) 
      return EXAMPLES.arraySumEven;
    return EXAMPLES.arrayIntermediate; // fallback: find max
  }
  
  // Advanced
  if (d === "advanced") {
    if (t.includes("subarray") || t.includes("kadane") || t.includes("max sum")) 
      return EXAMPLES.arrayMaxSubarraySum;
    if (t.includes("two sum") || t.includes("twosum") || t.includes("pair")) 
      return EXAMPLES.arrayTwoSum;
    return EXAMPLES.arrayAdvanced; // fallback: max - min diff
  }
}

  // ===== SORTING =====
  if (t.includes("sort") || t.includes("sorting")) {
    if (d === "advanced") return EXAMPLES.sortingAdvanced;
    if (d === "intermediate") return EXAMPLES.sortingIntermediate;
    return EXAMPLES.sortingBeginner;
  }

  // ===== QUEUE =====
  if (t.includes("queue")) {
    if (d === "advanced") return EXAMPLES.queueAdvanced;
    if (d === "intermediate") return EXAMPLES.queueIntermediate;
    return EXAMPLES.queueBeginner;
  }

  // ===== STACK =====
  if (t.includes("stack")) {
    if (d === "advanced") return EXAMPLES.stackAdvanced;
    if (d === "intermediate") return EXAMPLES.stackIntermediate;
    return EXAMPLES.stackBeginner;
  }

  // ===== STRINGS =====
  if (t.includes("string")) {
    if (d === "advanced") return EXAMPLES.stringAdvanced;
    if (d === "intermediate") return EXAMPLES.stringIntermediate;
    return EXAMPLES.stringBeginner;
  }

  // ===== MATH =====
  if (t.includes("math") || t.includes("factorial") || t.includes("fibonacci") || t.includes("prime")) {
    if (d === "advanced") return EXAMPLES.mathAdvanced;
    if (d === "intermediate") return EXAMPLES.mathIntermediate;
    return EXAMPLES.mathBeginner;
  }

  // Default
  return EXAMPLES.arrayBeginner;
}

function getDefaultExampleObject(language, topic, difficulty) {
  return getExampleForTopic(topic, language, difficulty);
}

module.exports = {
  getExampleForTopic,
  getDefaultExampleObject,
  EXAMPLES
};