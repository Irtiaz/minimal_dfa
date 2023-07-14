# Minimal DFA from Regex

- A single dot (.) means concatenation. It can be omitted in the input. For example, <i>a.b</i> and <i>ab</i> both mean a and b concatenated
- \* means star operation. For example, <i>(ab)*</i> means ab repeated 0 or more times
- \+ means union. For example, <i>a+b</i> means a or b
- Precedence in descending order: * . + (You can use parenthesis to change order of evaluation)
- <i>$</i> is used to indicate ε (empty string)
- Spaces are not considered a symbol. So you can add spaces as many times as you want