
// ========== TOPIC GUIDANCE ==========
function getTopicGuidance(topic, language, difficulty) {
  const topicLower = topic.toLowerCase();

  let guidance = `TOPIC: ${topic} in ${language}\n`;
  guidance += `DIFFICULTY: ${difficulty.toUpperCase()}\n\n`;

  // ===== OBJECT (OOP) - ENHANCED =====
  if (isOOPTopic(topic)) {
    const oopType = getOOPType(topic);
    guidance += getOOPGuidance(oopType, difficulty);
  }
  // ===== ARRAYS =====
  else if (topicLower.includes("array") || topicLower.includes("list")) {
    guidance += getArrayGuidance(difficulty);
  }
  // ===== SORTING =====
  else if (topicLower.includes("sort") || topicLower.includes("sorting")) {
    guidance += getSortingGuidance(difficulty);
  }
  // ===== QUEUE =====
  else if (topicLower.includes("queue")) {
    guidance += getQueueGuidance();
  }
  // ===== STACK =====
  else if (topicLower.includes("stack")) {
    guidance += getStackGuidance();
  }
  // ===== STRINGS =====
  else if (topicLower.includes("string")) {
    guidance += getStringGuidance();
  }
  // ===== MATH =====
  else if (topicLower.includes("math") || topicLower.includes("factorial") || 
           topicLower.includes("fibonacci") || topicLower.includes("prime")) {
    guidance += getMathGuidance(difficulty);
  }
  // ===== COLLECTIONS =====
  else if (topicLower.includes("collection") || topicLower.includes("list") || 
           topicLower.includes("arraylist") || topicLower.includes("linkedlist")) {
    guidance += getCollectionsGuidance(difficulty);
  }
  // ===== DEFAULT =====
  else {
    guidance += getDefaultGuidance(topic, language, difficulty);
  }

  guidance += `\n========== EXAMPLE ==========\n${getExampleBasedOnTopic(topic, difficulty)}\n`;
  return guidance;
}

// ========== OOP HELPERS ==========
function isOOPTopic(topic) {
  const t = topic.toLowerCase();
  const oopKeywords = [
    "class", "oop", "inheritance", "object", "private", "encapsulation",
    "abstract", "polymorphism", "interface", "override", "subclass",
    "shape", "vehicle", "animal", "employee", "bank", "account"
  ];
  return oopKeywords.some(k => t.includes(k));
}

function getOOPType(topic) {
  const t = topic.toLowerCase();
  if (t.includes("abstract")) return "abstract";
  if (t.includes("interface")) return "interface";
  if (t.includes("polymorphism")) return "polymorphism";
  if (t.includes("inheritance") || t.includes("extends") || t.includes("subclass")) return "inheritance";
  if (t.includes("encapsulation") || t.includes("private")) return "encapsulation";
  if (t.includes("shape") || t.includes("vehicle") || t.includes("animal")) return "hierarchy";
  return "basic";
}

function getOOPGuidance(oopType, difficulty) {
  const base = `
This problem focuses on OBJECT-ORIENTED PROGRAMMING (OOP).

WHAT TO IMPLEMENT:
• Classes with private fields, constructors, and methods
• Demonstrate OOP principles: Encapsulation, Inheritance, Polymorphism, Abstraction
• Methods should validate inputs and return meaningful results

INPUT: constructor arguments + method calls
OUTPUT: string representation of object state or method result

═══════════════════════════════════════════════════════════
🔷 OOP PRINCIPLES
═══════════════════════════════════════════════════════════`;

  const details = {
    abstract: `
🔷 ABSTRACT CLASS:
• Defined with 'abstract' keyword
• Contains abstract methods (no implementation) and concrete methods
• Cannot be instantiated directly
• Must be extended by concrete subclasses
• Provides common structure for subclasses

EXAMPLE:
abstract class Vehicle {
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
}`,

    interface: `
🔷 INTERFACE:
• Defined with 'interface' keyword
• All methods are implicitly public and abstract (until Java 8)
• Can have default and static methods (Java 8+)
• A class can implement multiple interfaces
• Defines a contract for implementing classes

EXAMPLE:
interface Drawable {
  void draw();
  default void print() {
    System.out.println("Printing...");
  }
}

interface Moveable {
  void move(int distance);
}

class Circle implements Drawable, Moveable {
  private double radius;
  
  public Circle(double radius) {
    if (radius <= 0) throw new IllegalArgumentException();
    this.radius = radius;
  }
  
  @Override
  public void draw() {
    System.out.println("Drawing Circle with radius " + radius);
  }
  
  @Override
  public void move(int distance) {
    System.out.println("Moving Circle " + distance + " units");
  }
}`,

    polymorphism: `
🔄 POLYMORPHISM:
• Method Overriding: Subclasses provide specific implementation of parent methods
• Runtime Polymorphism: Parent reference, child object
• Method Overloading: Multiple methods with same name, different parameters
• Enables writing code that works with objects of multiple types

EXAMPLE:
Shape shape1 = new Circle(5);       // Parent reference, child object
Shape shape2 = new Rectangle(4, 6); // Parent reference, child object

// Polymorphic behavior - each calculates its own area
double total = shape1.calculateArea() + shape2.calculateArea();

// Vehicle example:
Vehicle[] vehicles = {
  new Car(50, 2),    // Car calculateDistance() = speed * time
  new Truck(40, 3)   // Truck calculateDistance() = speed * time
};
// Total = 50*2 + 40*3 = 220`,

    inheritance: `
🔗 INHERITANCE:
• Use 'extends' keyword to create subclass (IS-A relationship)
• Subclass inherits all public/protected members from parent
• Use 'super' to call parent constructor/methods
• Can override methods with @Override annotation

EXAMPLE:
class Animal {
  protected String name;
  public Animal(String name) { 
    if (name == null) throw new IllegalArgumentException();
    this.name = name; 
  }
  public void speak() { System.out.println("..."); }
}

class Dog extends Animal {
  private String breed;
  public Dog(String name, String breed) {
    super(name);
    this.breed = breed;
  }
  @Override
  public void speak() { 
    System.out.println("Woof!"); 
  }
}`,

    encapsulation: `
📦 ENCAPSULATION:
• Use 'private' keyword for fields (data hiding)
• Provide public getters and setters (controlled access)
• Validate data in setters/constructors
• Hide implementation details from outside

EXAMPLE:
class Person {
  private String name;      // private field
  private int age;          // private field
  
  public Person(String name, int age) {
    if (name == null || name.isEmpty()) 
      throw new IllegalArgumentException("Name cannot be empty");
    if (age < 0) 
      throw new IllegalArgumentException("Age cannot be negative");
    this.name = name;
    this.age = age;
  }
  
  public String getName() { return name; }
  public int getAge() { return age; }
  public void setAge(int age) {
    if (age < 0) throw new IllegalArgumentException("Invalid age");
    this.age = age;
  }
}`,

    hierarchy: `
🔷 CLASS HIERARCHY:
• Base class with common attributes and methods
• Subclasses add specific attributes and methods
• Method overriding for specialized behavior
• Polymorphic collections (parent type array with child objects)

EXAMPLE:
class Shape {
  public double getArea() { return 0; }
}

class Circle extends Shape {
  private double radius;
  public Circle(double radius) {
    if (radius <= 0) throw new IllegalArgumentException();
    this.radius = radius;
  }
  @Override
  public double getArea() {
    return Math.PI * radius * radius;
  }
}`,

    basic: `
📦 BASIC OOP:
• Class with private fields
• Constructor with validation
• Getter and setter methods
• toString() or display method

EXAMPLE:
class Person {
  private String name;
  private int age;
  
  public Person(String name, int age) {
    if (name == null || name.isEmpty()) 
      throw new IllegalArgumentException("Name cannot be empty");
    if (age < 0) 
      throw new IllegalArgumentException("Age cannot be negative");
    this.name = name;
    this.age = age;
  }
  
  public String greet() {
    return "Hello, I'm " + name + ", " + age + " years old";
  }
}`
  };

  const scope = {
    beginner: `DIFFICULTY SCOPE (BEGINNER):
• Single class with basic encapsulation
• Simple constructor and methods
• Basic validation
• No inheritance or polymorphism
• ~15-20 lines of code`,

    intermediate: `DIFFICULTY SCOPE (INTERMEDIATE):
• Multiple classes with inheritance
• Method overriding
• Abstract classes OR interfaces
• Proper validation and error handling
• Basic polymorphism
• ~25-35 lines of code`,

    advanced: `DIFFICULTY SCOPE (ADVANCED):
• Complex hierarchy with abstract classes AND interfaces
• Multiple inheritance via interfaces
• Full polymorphism with collections
• Advanced design patterns
• Comprehensive error handling
• ~40-60 lines of code`
  };

  return `${base}\n${details[oopType] || details.basic}\n\n${scope[difficulty] || scope.intermediate}`;
}

// ========== OTHER GUIDANCE FUNCTIONS ==========
function getArrayGuidance(difficulty) {
  return `This problem focuses on ARRAY manipulation.

WHAT TO IMPLEMENT:
• A function that takes an integer array and returns a computed result
• Operations: sum, max, min, or difference depending on the problem

INPUT: int[] arr
OUTPUT: integer (or array for transformations)

DIFFICULTY SCOPE (${difficulty}):
${difficulty === "beginner" ? "• Simple operation (sum, max, min)\n• Small array, no edge cases required" :
  difficulty === "intermediate" ? "• Moderate operation (max-min, second max)\n• Handle empty array and single element" :
  "• Complex operation (subarray, difference)\n• Handle all edge cases, optimized solution"}`;
}

function getSortingGuidance(difficulty) {
  return `This problem focuses on SORTING algorithms.

WHAT TO IMPLEMENT:
• Sort an integer array in ascending order using a specific algorithm

INPUT: int[] arr
OUTPUT: int[] (sorted array)

ALGORITHM BY DIFFICULTY:
${difficulty === "beginner" ? "• Bubble Sort or Insertion Sort — O(n²)" :
  difficulty === "intermediate" ? "• Quick Sort — O(n log n) average" :
  "• Merge Sort or Heap Sort — O(n log n)"}`;
}

function getQueueGuidance() {
  return `This problem focuses on QUEUE (FIFO) operations.

WHAT TO IMPLEMENT:
• Process a Queue<Integer> and return a result (max, sum, etc.)
• Use only Queue API: offer(), poll(), peek()
• The original queue must remain unchanged after the call

INPUT: Queue<Integer>
OUTPUT: integer`;
}

function getStackGuidance() {
  return `This problem focuses on STACK (LIFO) operations.

WHAT TO IMPLEMENT:
• Process a Stack<Integer> and return a result (top element, sum, etc.)
• Use only Stack API: push(), pop(), peek()
• The original stack must remain unchanged after the call

INPUT: Stack<Integer>
OUTPUT: integer or Integer (nullable)`;
}

function getStringGuidance() {
  return `This problem focuses on STRING manipulation.

WHAT TO IMPLEMENT:
• A function that takes a String and returns a processed result
• Operations: palindrome check, reverse, vowel count, etc.

INPUT: String s
OUTPUT: boolean / String / integer depending on the operation`;
}

function getMathGuidance(difficulty) {
  return `This problem focuses on MATHEMATICAL computation.

WHAT TO IMPLEMENT:
• A function that takes an integer and returns a computed value
• Operations: factorial, Fibonacci, prime check, etc.

INPUT: int n
OUTPUT: long / boolean depending on operation

EDGE CASES: handle 0, 1, and negative inputs explicitly`;
}

function getCollectionsGuidance(difficulty) {
  return `This problem focuses on JAVA COLLECTIONS Framework.

WHAT TO IMPLEMENT:
• Work with List interface (ArrayList or LinkedList)
• Convert array to List using Arrays.asList() or similar
• Use Collection methods: add(), remove(), size(), etc.

INPUT: int[] arr or specific Collection type
OUTPUT: integer or boolean depending on the operation

DIFFICULTY SCOPE (${difficulty}):
${difficulty === "beginner" ? "• Simple operations: count, sum, average\n• Basic List conversion and iteration" :
  difficulty === "intermediate" ? "• Filtering and aggregation: sum of even numbers, count above average\n• Handle edge cases like empty list" :
  "• Complex operations: sublist conditions, optimized algorithms\n• Advanced list manipulation"}`;
}

function getDefaultGuidance(topic, language, difficulty) {
  return `This problem focuses on: ${topic}

WHAT TO IMPLEMENT:
• A function that solves the described problem
• Follow ${language} best practices and handle edge cases

INPUT / OUTPUT: as specified in the problem statement`;
}

// ========== EXAMPLE BASED ON TOPIC ==========
function getExampleBasedOnTopic(topic, difficulty) {
  const t = topic.toLowerCase();
  const d = difficulty.toLowerCase();

  // OOP examples
  if (isOOPTopic(t)) {
    const oopType = getOOPType(t);
    const examples = {
      abstract: {
        beginner: 'Input: new Dog("Buddy")\nOutput: "Woof!"',
        intermediate: 'Input: new Shape[]{ new Circle(5), new Rectangle(4, 6) }\nOutput: 102.54',
        advanced: 'Input: new Vehicle[]{ new Car(50, 2), new Truck(40, 3) }\nOutput: 220.0'
      },
      interface: {
        beginner: 'Input: new Document("Hello World")\nOutput: "Hello World"',
        intermediate: 'Input: new Payable[]{ new Employee(60000), new Freelancer(50, 40) }\nOutput: 7000.0',
        advanced: 'Input: new Circle(5)\nOutput: "Drawing Circle with radius 5.0"'
      },
      polymorphism: {
        beginner: 'Input: new Animal[]{ new Dog(), new Cat() }\nOutput: "Woof! Meow!"',
        intermediate: 'Input: new Shape[]{ new Circle(5), new Rectangle(4, 6) }\nOutput: 102.54',
        advanced: 'Input: new Animal[]{ new Dog(), new Cat(), new Cow() }\nOutput: "Woof! Meow! Moo!"'
      },
      inheritance: {
        beginner: 'Input: new Car("Toyota", 2020, "Camry")\nOutput: "Toyota (2020) - Camry"',
        intermediate: 'Input: new Manager("Alice", 75000, "IT", 5000)\nOutput: "Employee: Alice, Salary: $75000.0, Department: IT, Bonus: $5000.0"',
        advanced: 'Input: new SavingsAccount("SAV-123", "John Doe", 1000, 0.05)\nOutput: "Account: SAV-123 | Owner: John Doe | Balance: 1050.00"'
      },
      basic: {
        beginner: 'Input: new Person("John", 30)\nOutput: "Hello, I\'m John, 30 years old"',
        intermediate: 'Input: new Person("Jane", 25)\nOutput: "Hello, I\'m Jane, 25 years old"',
        advanced: 'Input: new Person("Bob", 40)\nOutput: "Hello, I\'m Bob, 40 years old"'
      }
    };
    return examples[oopType]?.[d] || examples.basic.intermediate;
  }

  // Non-OOP examples
  if (t.includes("sort") || t.includes("sorting")) {
    if (d === "advanced") return "Input: [10, -20, 30, -40, 50, 60, -70, 80, -90, 95, -5, 25]\nOutput: [-90, -70, -40, -20, -5, 10, 25, 30, 50, 60, 80, 95]";
    if (d === "intermediate") return "Input: [10, -20, 30, -40, 50, 60, -70, 80]\nOutput: [-70, -40, -20, 10, 30, 50, 60, 80]";
    return "Input: [10, -20, 30, -40, 50]\nOutput: [-40, -20, 10, 30, 50]";
  }

  if (t.includes("array")) {
    if (d === "advanced") return "Input: [10, -20, 30, -40, 50, 60, -70, 80, -90, 95]\nOutput: 185";
    if (d === "intermediate") return "Input: [10, 20, -30, 40, -50, 15, 5]\nOutput: 40";
    return "Input: [10, 20, 30, 40, 50]\nOutput: 150";
  }

  if (t.includes("queue")) return "Input: Queue containing [-8, 10, -2, 74, 46]\nOutput: 74";
  if (t.includes("stack")) return "Input: Stack with top = 89\nOutput: 89";
  if (t.includes("string")) return 'Input: "A man, a plan, a canal: Panama"\nOutput: true';
  if (t.includes("fibonacci")) return "Input: 10\nOutput: 55";
  if (t.includes("factorial")) return "Input: 5\nOutput: 120";
  if (t.includes("prime")) return "Input: 7\nOutput: true";

  return "Input: as specified\nOutput: as specified";
}

// ========== CONSTRAINTS FOR DISPLAY ==========
function getConstraintsForDisplay(topic, difficulty) {
  const t = topic.toLowerCase();
  const d = difficulty.toLowerCase();

  // OOP constraints
  if (isOOPTopic(t)) {
    const oopType = getOOPType(t);
    const baseConstraints = [
      "Use private fields (encapsulation - data hiding)",
      "Validate constructor inputs (throw exception for invalid values)",
      "Use appropriate access modifiers (private, protected, public)"
    ];

    const specificConstraints = {
      abstract: [
        "Create at least one abstract method in the abstract class",
        "Extend the abstract class in concrete subclasses",
        "Implement all abstract methods in concrete subclasses",
        "Cannot instantiate abstract class directly"
      ],
      interface: [
        "Define an interface with abstract methods",
        "Implement the interface using 'implements' keyword",
        "A class can implement multiple interfaces",
        "Use default methods if needed (Java 8+)"
      ],
      polymorphism: [
        "Override at least one method in subclasses with @Override",
        "Use polymorphism (parent reference, child object)",
        "Runtime method binding based on object type"
      ],
      inheritance: [
        "Use inheritance with 'extends' keyword",
        "Call parent constructor using 'super()'",
        "Access parent members using 'super' when needed",
        "Demonstrate IS-A relationship"
      ],
      hierarchy: [
        "Create a base class with common attributes",
        "Create subclasses that extend the base class",
        "Override methods in subclasses for specific behavior",
        "Use polymorphism with arrays or collections"
      ],
      basic: [
        "Class with private fields and getters/setters",
        "Constructor with validation",
        "toString() or display method",
        "Clean encapsulation of data"
      ]
    };

    return [...baseConstraints, ...(specificConstraints[oopType] || specificConstraints.basic)];
  }

  // Non-OOP constraints
  if (t.includes("sort") || t.includes("sorting")) {
    const algo = d === "advanced" ? "Merge Sort or Heap Sort — O(n log n)" :
      d === "intermediate" ? "Quick Sort — O(n log n) average" :
      "Bubble Sort or Insertion Sort — O(n²)";
    return [
      `Implement ${algo}`,
      "Sort in ascending order",
      "Return the sorted array",
      "Handle empty array (return empty)"
    ];
  }

  if (t.includes("array") || t.includes("list")) {
    const base = [
      "Return the computed result as an integer",
      "Handle empty array (throw exception or return 0)",
    ];
    if (d !== "beginner") base.push("Handle single-element array");
    if (d === "advanced") base.push("Optimized solution preferred");
    return base;
  }

  if (t.includes("queue")) {
    return [
      "Use Queue interface with LinkedList",
      "Only use Queue API: offer(), poll(), peek()",
      "Queue must remain unchanged after the call",
      "Throw an exception if the queue is empty"
    ];
  }

  if (t.includes("stack")) {
    return [
      "Use Java's Stack class",
      "Only use Stack API: push(), pop(), peek()",
      "Stack must remain unchanged after the call",
      "Return null if the stack is empty"
    ];
  }

  if (t.includes("string")) {
    return [
      "Handle empty string (return appropriate default)",
      "For palindrome: ignore case and non-alphanumeric characters",
      "Return the correct type (boolean / String / integer)"
    ];
  }

  if (t.includes("math") || t.includes("factorial") || t.includes("fibonacci") || t.includes("prime")) {
    const base = [
      "Handle n = 0 and n = 1 explicitly",
      "Throw exception for invalid input (e.g., negative n where not allowed)",
      "Return the correct type (long / boolean)"
    ];
    if (t.includes("fibonacci")) base.push("Use memoization for O(n) time");
    if (t.includes("prime")) base.push("Check up to sqrt(n) for efficiency");
    return base;
  }

  return [
    "Handle edge cases appropriately",
    "Follow best practices for the language",
    "Return the correct type"
  ];
}

// ========== LANGUAGE GUIDANCE ==========
function getLanguageGuidance(language) {
  const guidances = {
    javascript: `JAVASCRIPT RULES:
• Use ES6+ syntax (const, let, arrow functions)
• Use array methods (map, filter, reduce) where appropriate
• Private fields: use # prefix
• Queue: array + shift/push; Stack: array + push/pop
• Classes: use 'class', 'extends', 'super'
• Abstract: use new.target to check
• Interfaces: use TypeScript or JSDoc`,

    python: `PYTHON RULES:
• Python 3, follow PEP 8
• Use type hints
• Queue: collections.deque; Stack: list (append/pop)
• Private: __ prefix (name mangling)
• Abstract classes: use ABC and @abstractmethod from abc module
• Interfaces: use ABC or protocols`,

    java: `JAVA RULES:
• Proper class structure with generics
• Queue: java.util.Queue implemented by LinkedList — use offer(), poll(), peek()
• Stack: java.util.Stack — use push(), pop(), peek()
• Use private keyword for encapsulation
• Abstract classes: use 'abstract' keyword, can have abstract methods
• Interfaces: use 'interface' keyword, use 'implements' to implement
• Inheritance: use 'extends' keyword, call 'super()' in constructor
• Polymorphism: parent reference, child object`,

    csharp: `C# RULES:
• Proper class structure
• Queue: System.Collections.Generic.Queue<T>
• Stack: System.Collections.Generic.Stack<T>
• Use private keyword; leverage LINQ where appropriate
• Abstract classes: use 'abstract' keyword
• Interfaces: use 'interface' keyword, use ':' to implement
• Inheritance: use ':' and 'base' keyword`,

    cpp: `C++ RULES:
• C++17 features
• Queue: std::queue; Stack: std::stack; Array: std::vector
• Use private: access specifier
• Abstract classes: use 'virtual' and '= 0' for pure virtual
• Interfaces: use abstract class with all pure virtual methods`,

    go: `GO RULES:
• Go 1.20+
• Proper error handling
• Structs with methods; private fields use lowercase names
• Interfaces: use 'interface' keyword, implicit implementation
• No inheritance, use composition and embedding`
  };

  return guidances[language] || `${language.toUpperCase()} RULES:\n• Write idiomatic code\n• Follow standard naming conventions`;
}

// ========== DOMAIN NOTE ==========
function getDomainNote(domain) {
  const notes = {
    "DSA": "Focus on algorithm correctness and efficiency.",
    "OOP": "Focus on object-oriented design principles including Abstraction, Encapsulation, Inheritance, and Polymorphism.",
    "Object": "Focus on object-oriented design principles including Abstraction, Encapsulation, Inheritance, and Polymorphism.",
    "Concurrency": "Focus on thread safety and synchronization.",
    "Async": "Focus on asynchronous patterns and error handling.",
    "Functional Programming": "Focus on immutability, pure functions, and patterns like currying.",
    "Data Structures": "Focus on correct data structure implementation.",
    "Algorithms": "Focus on algorithm efficiency and correctness."
  };
  return notes[domain] || `Focus on ${domain} concepts.`;
}

// ========== GET TOPIC STYLE ==========
function getTopicStyle(topic, language, difficulty) {
  const t = topic.toLowerCase();

  let style = "function";
  let category = "default";

  if (isOOPTopic(t)) {
    style = "class";
    category = "oop";
  } else if (t.includes("queue") || t.includes("stack") || t.includes("linked") || 
             t.includes("tree") || t.includes("graph")) {
    style = "function";
    category = "data_structure";
  } else if (t.includes("array") || t.includes("list") || t.includes("collection")) {
    category = "array";
  } else if (t.includes("string")) {
    category = "string";
  } else if (t.includes("math") || t.includes("factorial") || t.includes("fibonacci") || 
             t.includes("prime")) {
    category = "math";
  }

  return { style, category };
}

// ========== IS CONCURRENCY/ASYNC ==========
function isConcurrencyOrAsyncTopic(topic) {
  const keywords = ["Threads", "Runnable", "Synchronized", "Locks", "Executors",
                    "Async/Await", "Promises", "Callbacks", "Goroutines", "Channels"];
  return keywords.some(k => topic.toLowerCase().includes(k.toLowerCase()));
}

module.exports = {
  getTopicGuidance,
  getLanguageGuidance,
  getDomainNote,
  isConcurrencyOrAsyncTopic,
  getTopicStyle,
  getConstraintsForDisplay,
  isOOPTopic,
  getOOPType,
  getOOPGuidance
}; 