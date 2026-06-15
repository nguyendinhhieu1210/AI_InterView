// services/liveCoding/llmProvider.js - WITH EXAMPLES

const { GroqService } = require("../ai/groqService");
const { extractJson } = require("../../utils/jsonExtractor");
const {
  getTopicGuidance,
  getLanguageGuidance,
  getDomainNote,
  isConcurrencyOrAsyncTopic,
  getTopicStyle,
} = require("./questionGuidance");
const {
  logRequest,
  logResponse,
  logError,
  logRateLimit,
  logTokenUsage,
  generateRequestId,
} = require("../../utils/aiLogger");

require("dotenv").config();

const groq = new GroqService(
  process.env.GROQ_API_KEY,
  "llama-3.3-70b-versatile",
  0.2,
);

// ========== UTILITY ==========
function getMeaningfulLines(code) {
  const lines = code.split("\n");
  const meaningful = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === "") continue;
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("/*")
    )
      continue;
    if (/^[{}()\[\];,\s]+$/.test(trimmed)) continue;
    meaningful.push({ lineNum: i + 1, content: lines[i] });
  }
  return meaningful;
}

function validateQuestion(question, code) {
  const lines = code.split("\n");
  const maxLine = lines.length;
  const meaningfulLines = getMeaningfulLines(code);
  const meaningfulLineNumbers = meaningfulLines.map((l) => l.lineNum);

  const lineMatches = question.match(/\b(?:dòng|line)\s+(\d+)\b/gi) || [];
  for (const match of lineMatches) {
    const lineNum = parseInt(match.match(/\d+/)[0]);
    if (lineNum < 1 || lineNum > maxLine) return false;
    if (!meaningfulLineNumbers.includes(lineNum)) return false;
  }

  return true;
}

function isProblemTooComplex(problemStatement, difficulty, topic = "") {
  const wordCount = problemStatement.split(/\s+/).length;
  if (difficulty === "beginner" && wordCount > 80) return true;
  if (difficulty === "intermediate" && wordCount > 120) return true;
  return false;
}

// ========== CALL AI ==========
// ========== CALL AI ==========
async function callAI(
  prompt,
  systemMessage = `You are an AI programming expert. Return valid JSON only. No markdown. No explanation outside JSON.`,
  feature = "general",
) {
  const requestId = generateRequestId();
  const model = "llama-3.3-70b-versatile";
  logRequest(model, requestId, prompt, 0.2);

  try {
    const messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt },
    ];

    const startTime = Date.now();
    const result = await groq.invokeWithRetry(messages);
    const durationMs = Date.now() - startTime;

    // ===== LẤY CONTENT TỪ RESPONSE =====
    // Nếu result là object có content, lấy content, nếu không thì dùng result
    const responseContent =
      typeof result === "object"
        ? result.content || JSON.stringify(result)
        : result;

    logResponse(model, requestId, responseContent, durationMs);

    // ===== LẤY TOKEN USAGE =====
    const usage = groq.getLastUsage();

    let inputTokens = 0,
      outputTokens = 0,
      totalTokens = 0;

    if (usage) {
      inputTokens = usage.input_tokens || usage.prompt_tokens || 0;
      outputTokens = usage.output_tokens || usage.completion_tokens || 0;
      totalTokens = usage.total_tokens || inputTokens + outputTokens || 0;
    } else {
      // Fallback: ước lượng từ độ dài text
      inputTokens = Math.ceil(prompt.length / 4);
      outputTokens = Math.ceil(responseContent.length / 4);
      totalTokens = inputTokens + outputTokens;
    }

    logTokenUsage(
      model,
      requestId,
      inputTokens,
      outputTokens,
      totalTokens,
      feature,
    );

    console.log(`\n========== TOKEN USAGE [${feature}] ==========`);
    console.log(`Input tokens: ${inputTokens}`);
    console.log(`Output tokens: ${outputTokens}`);
    console.log(`Total tokens: ${totalTokens}`);
    console.log(`Response preview: ${responseContent.substring(0, 150)}...`);
    console.log(`=============================================\n`);

    return responseContent;
  } catch (error) {
    console.error("LLM Provider Error:", error);
    logError(model, requestId, error, feature);
    return fallbackResponse(prompt);
  }
}

function fallbackResponse(prompt) {
  return JSON.stringify({
    problemStatement:
      "Write a function that takes an array of integers and returns the sum.",
    functionSignature: "function sum(arr) { }",
    content: "Sum array elements",
    testCriteria: "Handle empty array",
    exampleInput: "[1, 2, 3]",
    exampleOutput: "6",
    description: "Sum all numbers in array",
  });
}

// ========== HÀM TẠO CÂU HỎI - CÓ VÍ DỤ CỤ THỂ ==========
// ========== HÀM TẠO CÂU HỎI - CÓ VÍ DỤ CỤ THỂ (FIXED) ==========
async function generateCodeQuestion(language, domain, topic, difficulty) {
  const { style } = getTopicStyle(topic, language, difficulty);

  // Lấy guidance
  const topicGuidance = getTopicGuidance(topic, language, difficulty);
  const languageGuidance = getLanguageGuidance(language);
  const domainNote = getDomainNote(domain);

  // ===== VÍ DỤ CỤ THỂ CHO TỪNG TOPIC =====
  let examples = "";

  // ===== JAVA EXAMPLES =====
  if (style === "function" && topic === "Arrays") {
    examples = getArrayExample(language);
  } else if (style === "function" && topic === "Sorting") {
    examples = getSortingExample(language);
  } else if (style === "class" && topic === "Inheritance") {
    examples = getInheritanceExample(language);
  } else if (style === "class" && topic === "Encapsulation") {
    examples = getEncapsulationExample(language);
  } else if (style === "auto" && (topic === "Stack" || topic === "Queue")) {
    examples = getStackQueueExample(language);
  }

  // ===== C++ SPECIFIC EXAMPLES =====
  else if (topic === "Smart Pointers") {
    examples = getSmartPointersExample();
  } else if (topic === "Move Semantics") {
    examples = getMoveSemanticsExample();
  } else if (topic === "Templates") {
    examples = getTemplatesExample();
  } else if (topic === "STL") {
    examples = getSTLExample();
  }

  // ===== C# SPECIFIC EXAMPLES =====
  else if (topic === "Events") {
    examples = getEventsExample();
  } else if (topic === "Properties") {
    examples = getPropertiesExample();
  } else if (topic === "LINQ") {
    examples = getLINQExample();
  } else if (topic === "async/await" || topic === "Async/Await") {
    examples = getAsyncAwaitExample(language);
  }

  // ===== GO SPECIFIC EXAMPLES =====
  else if (topic === "Goroutines") {
    examples = getGoroutinesExample();
  } else if (topic === "Channels") {
    examples = getChannelsExample();
  } else if (topic === "Select") {
    examples = getSelectExample();
  } else if (topic === "WaitGroups") {
    examples = getWaitGroupsExample();
  } else if (topic === "Context") {
    examples = getContextExample();
  }

  // ===== DEFAULT TEMPLATE =====
  else {
    examples = getDefaultExample(language);
  }

  // Difficulty rules
  const difficultyMap = {
    beginner:
      "Max 15 lines. Simple logic. One function or simple class. No recursion.",
    intermediate:
      "15-30 lines. Can have class with 2-3 methods. One loop allowed.",
    advanced:
      "30-50 lines. Can have inheritance or recursion. Complex logic allowed.",
  };

  const difficultyRules =
    difficultyMap[difficulty.toLowerCase()] || difficultyMap.intermediate;

  const prompt = `Generate a coding problem with these specifications:

LANGUAGE: ${language}
DOMAIN: ${domain}
TOPIC: ${topic}
DIFFICULTY: ${difficulty.toUpperCase()}

${topicGuidance}

${languageGuidance}
${domainNote}

DIFFICULTY RULES: ${difficultyRules}

${examples}

NOW generate a NEW problem for ${topic} in ${language} at ${difficulty} level.
The problem MUST be SPECIFIC and PRACTICAL - something a real developer would implement.
Return ONLY valid JSON, no markdown, no explanation.`;

  const result = await callAI(prompt, undefined, "generateCodeQuestion");
  const parsed = extractJson(result);

  if (parsed && typeof parsed === "object") {
    if (!parsed.problemStatement) {
      parsed.problemStatement =
        parsed.content || parsed.description || "Problem not provided";
    }
    if (!parsed.functionSignature) {
      parsed.functionSignature = "// Function signature here";
    }
    if (!parsed.exampleInput) {
      parsed.exampleInput = "// Example usage";
    }
    if (!parsed.exampleOutput) {
      parsed.exampleOutput = "// Expected output";
    }
    if (!parsed.testCriteria) {
      parsed.testCriteria = "• Test case 1\n• Test case 2";
    }
    if (!parsed.description) {
      parsed.description = parsed.problemStatement.substring(0, 100);
    }
    parsed.content = parsed.problemStatement;

    return parsed;
  }

  return extractJson(fallbackResponse("coding problem"));
}

// ========== HÀM LẤY VÍ DỤ CHO TỪNG TOPIC ==========

function getArrayExample(language) {
  return `
EXAMPLE OF A GOOD ARRAY PROBLEM (${language}):
{
  "problemStatement": "Write a function that takes an array of integers and returns the sum of all elements. If the array is empty, return 0.",
  "functionSignature": "${language === "java" ? "public static int sumArray(int[] arr)" : language === "python" ? "def sum_array(arr: list) -> int:" : "function sumArray(arr) { }"}",
  "exampleInput": "${language === "java" ? "int[] numbers = {1, 2, 3, 4, 5};\\nint result = sumArray(numbers);" : language === "python" ? "numbers = [1, 2, 3, 4, 5]\\nresult = sum_array(numbers)" : "const numbers = [1, 2, 3, 4, 5];\\nconst result = sumArray(numbers);"}",
  "exampleOutput": "result = 15",
  "testCriteria": "• Empty array: return 0\\n• Single element: return that element\\n• Negative numbers: sum correctly",
  "description": "Calculate the sum of all integers in an array."
}`;
}

function getSortingExample(language) {
  return `
EXAMPLE OF A GOOD SORTING PROBLEM (${language}):
{
  "problemStatement": "Write a function that sorts an array of integers in ascending order. Do not use built-in sort methods.",
  "functionSignature": "${language === "python" ? "def bubble_sort(arr: list) -> list:" : "function bubbleSort(arr) { }"}",
  "exampleInput": "numbers = [64, 34, 25, 12, 22, 11, 90]\\nsorted_nums = bubble_sort(numbers)",
  "exampleOutput": "sorted_nums = [11, 12, 22, 25, 34, 64, 90]",
  "testCriteria": "• Already sorted array\\n• Reverse sorted array\\n• Array with duplicates\\n• Single element array\\n• Empty array",
  "description": "Sort an array using bubble sort algorithm."
}`;
}

function getInheritanceExample(language) {
  return `
EXAMPLE OF A GOOD INHERITANCE PROBLEM (${language}):
{
  "problemStatement": "Create an Animal class with a makeSound() method. Then create a Dog class that extends Animal and overrides makeSound(). Also add a bark() method specific to Dog.",
  "functionSignature": "${language === "java" ? "class Animal { public void makeSound() { } }\\nclass Dog extends Animal { @Override public void makeSound() { } public void bark() { } }" : language === "python" ? "class Animal:\\n    def make_sound(self): pass\\nclass Dog(Animal):\\n    def make_sound(self): pass\\n    def bark(self): pass" : "class Animal { makeSound() { } }\\nclass Dog extends Animal { makeSound() { } bark() { } }"}",
  "exampleInput": "Animal myAnimal = new Animal();\\nDog myDog = new Dog();\\nmyAnimal.makeSound();\\nmyDog.makeSound();\\nmyDog.bark();",
  "exampleOutput": "Some sound\\nWoof!\\nBarking...",
  "testCriteria": "• Animal class exists\\n• Dog extends Animal\\n• Dog overrides makeSound()\\n• Dog has bark() method",
  "description": "Demonstrate inheritance with Animal and Dog classes."
}`;
}

function getEncapsulationExample(language) {
  return `
EXAMPLE OF A GOOD ENCAPSULATION PROBLEM (${language}):
{
  "problemStatement": "Create a BankAccount class with private balance field. Provide deposit(amount) and withdraw(amount) methods with validation.",
  "functionSignature": "${language === "java" ? "public class BankAccount { private double balance; public void deposit(double amount) { } public boolean withdraw(double amount) { } public double getBalance() { } }" : language === "python" ? "class BankAccount:\\n    def __init__(self):\\n        self.__balance = 0\\n    def deposit(self, amount): pass\\n    def withdraw(self, amount): pass\\n    def get_balance(self): pass" : "class BankAccount { #balance; deposit(amount) { } withdraw(amount) { } getBalance() { } }"}",
  "exampleInput": "account = BankAccount(100)\\naccount.deposit(50)\\naccount.withdraw(30)\\nprint(account.get_balance())",
  "exampleOutput": "120",
  "testCriteria": "• Balance is private\\n• Deposit validates amount > 0\\n• Withdraw checks sufficient balance",
  "description": "Create a bank account with encapsulated balance."
}`;
}

function getStackQueueExample(language) {
  const lang = language.toLowerCase();
  const isClassBased = ["java", "csharp", "cpp"].includes(lang);

  if (isClassBased) {
    return `
EXAMPLE FOR STACK (CLASS-BASED for ${language}):
{
  "problemStatement": "Implement a Stack class with push(item), pop(), peek(), and isEmpty() methods.",
  "functionSignature": "public class Stack<T> {\\n    private List<T> items;\\n    public Stack() { }\\n    public void push(T item) { }\\n    public T pop() { }\\n    public T peek() { }\\n    public boolean isEmpty() { }\\n}",
  "exampleInput": "Stack<Integer> stack = new Stack<>();\\nstack.push(10);\\nstack.push(20);\\nSystem.out.println(stack.pop());\\nSystem.out.println(stack.peek());",
  "exampleOutput": "20\\n10",
  "description": "Implement a generic Stack class."
}`;
  } else {
    return `
EXAMPLE FOR STACK (FUNCTION-BASED for ${language}):
{
  "problemStatement": "Write functions to implement a stack: push(stack, item), pop(stack), peek(stack), is_empty(stack).",
  "functionSignature": "def push(stack, item):\\ndef pop(stack):\\ndef peek(stack):\\ndef is_empty(stack):",
  "exampleInput": "stack = []\\npush(stack, 10)\\npush(stack, 20)\\nprint(pop(stack))\\nprint(peek(stack))",
  "exampleOutput": "20\\n10",
  "description": "Implement stack operations using functions."
}`;
  }
}

// ===== C++ EXAMPLES =====
function getSmartPointersExample() {
  return `
EXAMPLE FOR SMART POINTERS (C++):
{
  "problemStatement": "Create a Person class with name and age. Use unique_ptr to manage Person objects in a vector. Demonstrate automatic cleanup when vector goes out of scope.",
  "functionSignature": "class Person { string name; int age; };\\nint main() { vector<unique_ptr<Person>> people; people.push_back(make_unique<Person>(\"Alice\", 30)); }",
  "exampleInput": "auto p1 = make_unique<Person>(\"Alice\", 30);\\nauto p2 = make_unique<Person>(\"Bob\", 25);\\npeople.push_back(move(p1));\\npeople.push_back(move(p2));",
  "exampleOutput": "People vector size: 2\\nPerson destroyed when vector clears",
  "testCriteria": "• Use make_unique for creation\\n• No raw new/delete\\n• Move semantics for transfer\\n• Automatic cleanup",
  "description": "Demonstrate RAII with smart pointers."
}`;
}

function getMoveSemanticsExample() {
  return `
EXAMPLE FOR MOVE SEMANTICS (C++):
{
  "problemStatement": "Implement a Buffer class that manages a dynamic array. Implement move constructor and move assignment operator to transfer ownership without copying.",
  "functionSignature": "class Buffer {\\n    int* data;\\n    size_t size;\\npublic:\\n    Buffer(Buffer&& other) noexcept;\\n    Buffer& operator=(Buffer&& other) noexcept;\\n};",
  "exampleInput": "Buffer b1(1000);\\nBuffer b2 = std::move(b1);  // b1 becomes empty",
  "exampleOutput": "b2.size() = 1000\\nb1.size() = 0",
  "testCriteria": "• Move constructor transfers ownership\\n• Source object left in valid state\\n• No memory leaks\\n• noexcept specifier",
  "description": "Implement move semantics for efficient resource transfer."
}`;
}

function getTemplatesExample() {
  return `
EXAMPLE FOR TEMPLATES (C++):
{
  "problemStatement": "Write a generic findMax function that works with any type that supports comparison operators (int, double, string).",
  "functionSignature": "template<typename T>\\nT findMax(const vector<T>& arr) { }",
  "exampleInput": "vector<int> nums = {3, 7, 2, 9, 1};\\nint maxInt = findMax(nums);\\nvector<string> words = {\"apple\", \"zebra\", \"banana\"};\\nstring maxStr = findMax(words);",
  "exampleOutput": "maxInt = 9\\nmaxStr = \"zebra\"",
  "testCriteria": "• Works with int, double, string\\n• Handles empty vector\\n• Uses const reference for efficiency",
  "description": "Create a generic function using templates."
}`;
}

function getSTLExample() {
  return `
EXAMPLE FOR STL (C++):
{
  "problemStatement": "Write a function that removes all duplicate values from a vector using std::sort and std::unique. Return a new vector with unique elements in sorted order.",
  "functionSignature": "vector<int> removeDuplicates(const vector<int>& input)",
  "exampleInput": "vector<int> nums = {3, 1, 4, 1, 5, 9, 2, 6, 5, 3};\\nauto result = removeDuplicates(nums);",
  "exampleOutput": "result = [1, 2, 3, 4, 5, 6, 9]",
  "testCriteria": "• Uses std::sort\\n• Uses std::unique\\n• Handles empty vector\\n• Preserves sorted order",
  "description": "Use STL algorithms to remove duplicates."
}`;
}

// ===== C# EXAMPLES =====
function getEventsExample() {
  return `
EXAMPLE FOR EVENTS (C#):
{
  "problemStatement": "Create a Button class with a Click event. When the button is clicked, raise the event with a message. Demonstrate subscribing to and handling the event.",
  "functionSignature": "public class Button {\\n    public event EventHandler Click;\\n    public void OnClick() { }\\n}",
  "exampleInput": "Button btn = new Button();\\nbtn.Click += (sender, e) => Console.WriteLine(\"Button clicked!\");\\nbtn.OnClick();",
  "exampleOutput": "Button clicked!",
  "testCriteria": "• Event uses EventHandler delegate\\n• Null check before raising\\n• Can subscribe multiple handlers",
  "description": "Implement and use events in C#."
}`;
}

function getPropertiesExample() {
  return `
EXAMPLE FOR PROPERTIES (C#):
{
  "problemStatement": "Create a Product class with Name (required, max 100 chars) and Price (positive) properties. Use validation in setters.",
  "functionSignature": "public class Product {\\n    private string name;\\n    private decimal price;\\n    public string Name { get; set; }\\n    public decimal Price { get; set; }\\n}",
  "exampleInput": "Product p = new Product();\\np.Name = \"Laptop\";\\np.Price = 999.99m;\\nConsole.WriteLine(p.Name);",
  "exampleOutput": "Laptop",
  "testCriteria": "• Name cannot be null or empty\\n• Name max length 100\\n• Price must be > 0\\n• Properties validate input",
  "description": "Create a class with validation in property setters."
}`;
}

function getLINQExample() {
  return `
EXAMPLE FOR LINQ (C#):
{
  "problemStatement": "Given a list of Product objects (Name, Price, Category), use LINQ to get the names of products in 'Electronics' category priced over $500, sorted by price descending.",
  "functionSignature": "List<string> GetExpensiveElectronics(List<Product> products)",
  "exampleInput": "var products = new List<Product> {\\n    new Product { Name = \"Laptop\", Price = 1200, Category = \"Electronics\" },\\n    new Product { Name = \"Mouse\", Price = 25, Category = \"Electronics\" }\\n};\\nvar result = GetExpensiveElectronics(products);",
  "exampleOutput": "result = [\"Laptop\"]",
  "testCriteria": "• Uses LINQ Where, OrderByDescending, Select\\n• Returns only names\\n• Filters correctly\\n• Returns empty list if none match",
  "description": "Use LINQ to query and transform data."
}`;
}

function getAsyncAwaitExample(language) {
  if (language === "csharp") {
    return `
EXAMPLE FOR ASYNC/AWAIT (C#):
{
  "problemStatement": "Write an async method that downloads data from multiple URLs concurrently using Task.WhenAll. Return concatenated results.",
  "functionSignature": "public async Task<string> DownloadAllAsync(string[] urls)",
  "exampleInput": "string[] urls = { \"https://api1.com\", \"https://api2.com\" };\\nstring result = await DownloadAllAsync(urls);",
  "exampleOutput": "Content from api1.com\\nContent from api2.com",
  "testCriteria": "• Uses async/await pattern\\n• Uses Task.WhenAll for concurrency\\n• Handles exceptions\\n• Returns Task<string>",
  "description": "Implement concurrent async downloads."
}`;
  } else if (language === "javascript") {
    return `
EXAMPLE FOR ASYNC/AWAIT (JavaScript):
{
  "problemStatement": "Write an async function that fetches data from multiple APIs using Promise.all and returns combined results.",
  "functionSignature": "async function fetchAllData(urls) { }",
  "exampleInput": "const urls = ['https://api1.com', 'https://api2.com'];\\nconst data = await fetchAllData(urls);",
  "exampleOutput": "['data1', 'data2']",
  "testCriteria": "• Uses async/await\\n• Uses Promise.all\\n• Handles errors\\n• Returns combined results",
  "description": "Fetch multiple APIs concurrently."
}`;
  }
  return getDefaultExample(language);
}

// ===== GO EXAMPLES =====
function getGoroutinesExample() {
  return `
EXAMPLE FOR GOROUTINES (Go):
{
  "problemStatement": "Write a function that launches multiple goroutines to print numbers from 1 to N concurrently. Use sync.WaitGroup to ensure all goroutines complete.",
  "functionSignature": "func printNumbersConcurrently(n int)",
  "exampleInput": "printNumbersConcurrently(5)",
  "exampleOutput": "Goroutine 1: 1\\nGoroutine 2: 2\\nGoroutine 3: 3\\nGoroutine 4: 4\\nGoroutine 5: 5",
  "testCriteria": "• Uses 'go' keyword\\n• Uses sync.WaitGroup\\n• All goroutines complete\\n• No data races",
  "description": "Launch and manage multiple goroutines."
}`;
}

function getChannelsExample() {
  return `
EXAMPLE FOR CHANNELS (Go):
{
  "problemStatement": "Write a function that sends numbers 1 to N into a channel, and another goroutine that reads and squares each number. Use unbuffered channels for synchronization.",
  "functionSignature": "func processNumbers(n int) []int",
  "exampleInput": "result := processNumbers(5)",
  "exampleOutput": "result = [1, 4, 9, 16, 25]",
  "testCriteria": "• Uses make(chan int)\\n• Send/receive with <- operator\\n• Channel closing\\n• Synchronization via channels",
  "description": "Use channels for communication between goroutines."
}`;
}

function getSelectExample() {
  return `
EXAMPLE FOR SELECT (Go):
{
  "problemStatement": "Write a function that receives from two channels and uses select to handle whichever arrives first. Add a timeout using time.After.",
  "functionSignature": "func firstResponse(ch1, ch2 <-chan string) string",
  "exampleInput": "ch1 := make(chan string)\\nch2 := make(chan string)\\ngo func() { time.Sleep(100*time.Millisecond); ch1 <- \"from ch1\" }()\\ngo func() { ch2 <- \"from ch2\" }()\\nresult := firstResponse(ch1, ch2)",
  "exampleOutput": "\"from ch2\" (or whichever arrives first)",
  "testCriteria": "• Uses select statement\\n• Handles multiple channels\\n• Implements timeout\\n• Non-blocking operations",
  "description": "Use select to wait on multiple channel operations."
}`;
}

function getWaitGroupsExample() {
  return `
EXAMPLE FOR WAITGROUPS (Go):
{
  "problemStatement": "Write a function that processes a list of URLs concurrently using goroutines. Use sync.WaitGroup to wait for all HTTP requests to complete before returning.",
  "functionSignature": "func fetchAll(urls []string) []string",
  "exampleInput": "urls := []string{\"https://api1.com\", \"https://api2.com\", \"https://api3.com\"}\\nresults := fetchAll(urls)",
  "exampleOutput": "results = [\"response1\", \"response2\", \"response3\"]",
  "testCriteria": "• Uses sync.WaitGroup\\n• Add/Done/Wait methods\\n• Concurrent execution\\n• Collects all results",
  "description": "Use WaitGroup to wait for goroutine completion."
}`;
}

function getContextExample() {
  return `
EXAMPLE FOR CONTEXT (Go):
{
  "problemStatement": "Write a function that performs an HTTP request that can be cancelled via context. Use context.WithTimeout to automatically cancel after 1 second.",
  "functionSignature": "func fetchWithTimeout(ctx context.Context, url string) (string, error)",
  "exampleInput": "ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)\\ndefer cancel()\\nresult, err := fetchWithTimeout(ctx, \"https://slow-api.com\")",
  "exampleOutput": "If success: \"response data\"\\nIf timeout: \"context deadline exceeded\"",
  "testCriteria": "• Uses context.Context\\n• Checks ctx.Done()\\n• Handles cancellation\\n• Returns appropriate error",
  "description": "Use context for timeout and cancellation."
}`;
}

function getDefaultExample(language) {
  return `
EXAMPLE TEMPLATE:
{
  "problemStatement": "Clear description of what to implement in ${language}",
  "functionSignature": "Exact signature in ${language}",
  "exampleInput": "Code showing how to use",
  "exampleOutput": "Expected output",
  "testCriteria": "• Bullet points of test cases",
  "description": "One sentence summary"
}`;
}
// ========== CÁC HÀM KHÁC (giữ nguyên từ bản cũ) ==========

async function generateExplanationQuestion(
  language,
  userCode,
  originalQuestion,
  difficulty = "beginner",
) {
  const meaningfulLines = getMeaningfulLines(userCode);
  const lineList = meaningfulLines
    .map((l) => `Line ${l.lineNum}: ${l.content.trim()}`)
    .join("\n");

  const prompt = `Language: ${language}
Difficulty: ${difficulty}

CODE:
\`\`\`${language}
${userCode}
\`\`\`

MEANINGFUL LINES:
${lineList}

Pick ONE line from above. Ask what it does and why it's needed. Quote the exact code.
Return JSON: {"type": "explain", "question": "..."}`;

  const result = await callAI(prompt, undefined, "generateExplanationQuestion");
  const parsed = extractJson(result);

  if (
    parsed?.type === "explain" &&
    parsed?.question &&
    validateQuestion(parsed.question, userCode)
  ) {
    return { type: "explain", question: parsed.question };
  }

  if (meaningfulLines.length > 0) {
    const random =
      meaningfulLines[Math.floor(Math.random() * meaningfulLines.length)];
    return {
      type: "explain",
      question: `On line ${random.lineNum}: \`${random.content.trim()}\`. What does this line do and why is it needed?`,
    };
  }
  return {
    type: "explain",
    question: "Explain the overall purpose and logic of the code above.",
  };
}

async function generateNextExplanationQuestion(
  language,
  userCode,
  userAnswer,
  currentQuestion,
  explainCount,
  difficulty = "beginner",
) {
  const meaningfulLines = getMeaningfulLines(userCode);
  const lineList = meaningfulLines
    .map((l) => `Line ${l.lineNum}: ${l.content.trim()}`)
    .join("\n");

  const prompt = `Language: ${language}
Previous Q: ${currentQuestion.question}
Student's answer: ${userAnswer}

CODE:
\`\`\`${language}
${userCode}
\`\`\`

MEANINGFUL LINES:
${lineList}

Ask about a DIFFERENT line. Return JSON: {"type": "explain", "question": "..."}`;

  const result = await callAI(
    prompt,
    undefined,
    "generateNextExplanationQuestion",
  );
  const parsed = extractJson(result);

  if (
    parsed?.type === "explain" &&
    parsed?.question &&
    validateQuestion(parsed.question, userCode)
  ) {
    return { type: "explain", question: parsed.question };
  }

  const previousLineMatch =
    currentQuestion.question.match(/\b(?:line)\s+(\d+)\b/i);
  const previousLineNum = previousLineMatch
    ? parseInt(previousLineMatch[1])
    : null;
  let available = meaningfulLines.filter((l) => l.lineNum !== previousLineNum);
  if (available.length === 0) available = meaningfulLines;
  const random = available[Math.floor(Math.random() * available.length)];
  return {
    type: "explain",
    question: `On line ${random.lineNum}: \`${random.content.trim()}\`. Why is this line necessary?`,
  };
}

async function evaluateExplanation(language, answer, currentQuestion) {
  const prompt = `Language: ${language}
Question: ${currentQuestion.question}
Student's answer: ${answer}

Evaluate if correct. Return JSON:
{
  "correct": true/false,
  "feedback": "One sentence starting with Correct/Incorrect.",
  "modelAnswer": "Complete answer (2-3 sentences)"
}`;

  try {
    const result = await callAI(prompt, undefined, "evaluateExplanation");
    const parsed = extractJson(result);
    if (
      parsed &&
      typeof parsed.correct === "boolean" &&
      typeof parsed.feedback === "string"
    ) {
      return {
        correct: parsed.correct,
        feedback: parsed.feedback.replace(/\.\.\./g, "."),
        modelAnswer: (parsed.modelAnswer || "No model answer.").replace(
          /\.\.\./g,
          ".",
        ),
      };
    }
    throw new Error("Invalid response");
  } catch (e) {
    console.error("evaluateExplanation error:", e);
    return {
      correct: false,
      feedback: "AI is overloaded. Please try again.",
      modelAnswer: "No model answer due to system error.",
    };
  }
}

async function evaluateCodeAndExplanations(
  language,
  code,
  problemStatement,
  explainAnswers,
) {
  const prompt = `Language: ${language}
Problem: ${problemStatement}

Code:
\`\`\`${language}
${code}
\`\`\`

Explanations: ${JSON.stringify(explainAnswers, null, 2)}

Evaluate overall performance. Return JSON:
{
  "summary": "2-3 sentence summary",
  "feedback": "Specific advice",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"]
}`;

  try {
    const result = await callAI(
      prompt,
      undefined,
      "evaluateCodeAndExplanations",
    );
    const parsed = extractJson(result);
    if (parsed && typeof parsed.summary === "string") {
      const clean = (str) => (str || "").replace(/\.\.\./g, ".");
      const cleanArr = (arr) =>
        Array.isArray(arr) ? arr.map((s) => clean(s)) : [];
      return {
        summary: clean(parsed.summary),
        feedback: clean(parsed.feedback || parsed.summary),
        strengths: cleanArr(parsed.strengths),
        weaknesses: cleanArr(parsed.weaknesses),
      };
    }
    throw new Error("Invalid response");
  } catch (e) {
    console.error("evaluateCodeAndExplanations error:", e);
    return {
      summary: "Unable to evaluate due to system error.",
      feedback: "AI encountered an issue. Please try again.",
      strengths: [],
      weaknesses: [],
    };
  }
}

async function evaluateCodeSubmission(
  language,
  code,
  problemStatement,
  expectedOutput = "",
) {
  const syntaxPrompt = `Check syntax errors in this ${language} code:
\`\`\`${language}
${code}
\`\`\`
Return JSON: {"hasSyntaxError": boolean, "feedback": "..."}`;

  try {
    const syntaxResult = await callAI(
      syntaxPrompt,
      undefined,
      "evaluateCode_syntax",
    );
    const syntaxParsed = extractJson(syntaxResult);

    if (syntaxParsed?.hasSyntaxError === true) {
      return {
        correct: false,
        feedback: (syntaxParsed.feedback || "Syntax error detected.").replace(
          /\.\.\./g,
          ".",
        ),
        modelAnswer: "",
      };
    }

    const logicPrompt = `Language: ${language}
Problem: ${problemStatement}
Expected output: ${expectedOutput}

Code:
\`\`\`${language}
${code}
\`\`\`

Check if correct for typical valid inputs. Return JSON:
{
  "correct": boolean,
  "feedback": "One sentence.",
  "modelAnswer": "Short fix if wrong (empty if correct)"
}`;

    const logicResult = await callAI(
      logicPrompt,
      undefined,
      "evaluateCode_logic",
    );
    const logicParsed = extractJson(logicResult);

    if (logicParsed && typeof logicParsed.correct === "boolean") {
      return {
        correct: logicParsed.correct,
        feedback: (
          logicParsed.feedback ||
          (logicParsed.correct ? "Code is correct." : "Logic error.")
        ).replace(/\.\.\./g, "."),
        modelAnswer: (logicParsed.modelAnswer || "").replace(/\.\.\./g, "."),
      };
    }

    throw new Error("Invalid logic response");
  } catch (e) {
    console.error("evaluateCodeSubmission error:", e);
    return {
      correct: false,
      feedback: "Unable to evaluate code due to AI error.",
      modelAnswer: "",
    };
  }
}

module.exports = {
  callAI,
  generateCodeQuestion,
  generateExplanationQuestion,
  generateNextExplanationQuestion,
  evaluateExplanation,
  evaluateCodeAndExplanations,
  evaluateCodeSubmission,
  validateQuestion,
  getMeaningfulLines,
};
