document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const expressionInput = document.getElementById('expression');
    const generateBtn = document.getElementById('generate-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const tableHeader = document.getElementById('table-header');
    const tableBody = document.getElementById('table-body');
    const errorMessage = document.getElementById('error-message');
    const notification = document.getElementById('notification');
    const operatorBtns = document.querySelectorAll('.operator-btn');
    const exampleBtns = document.querySelectorAll('.example-btn');

    // Operator precedence
    const precedence = {
        '¬': 4,
        '∧': 3,
        '∨': 2,
        '⊕': 2,
        '→': 1,
        '↔': 1
    };

    // Operator functions
    const operators = {
        '¬': (a) => !a,
        '∧': (a, b) => a && b,
        '∨': (a, b) => a || b,
        '→': (a, b) => !a || b,
        '↔': (a, b) => a === b,
        '⊕': (a, b) => a !== b
    };

    // Helper Functions

    // Function to validate expression
    function isValidExpression(expression) {
        if (!expression.trim()) return false;
        
        try {
            parseExpression(expression);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Function to update input validation state
    function updateValidationState(isValid, message = '') {
        const validationMessage = document.createElement('div');
        validationMessage.className = `validation-message ${isValid ? 'validation-valid' : 'validation-invalid'}`;
        validationMessage.textContent = message || (isValid ? 'Valid expression' : 'Invalid expression');
        
        // Remove any existing validation message
        const existingMessage = expressionInput.nextElementSibling;
        if (existingMessage && existingMessage.classList.contains('validation-message')) {
            existingMessage.remove();
        }
        
        // Add new validation message
        expressionInput.insertAdjacentElement('afterend', validationMessage);
        
        // Update input styling
        expressionInput.classList.remove('input-valid', 'input-invalid');
        expressionInput.classList.add(isValid ? 'input-valid' : 'input-invalid');
    }

    // Function to show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        updateValidationState(false, message);
    }

    // Function to hide error message
    function hideError() {
        errorMessage.classList.add('hidden');
    }

    // Function to show notification
    function showNotification(message) {
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Function to insert text at cursor position
    function insertAtCursor(input, text) {
        const startPos = input.selectionStart;
        const endPos = input.selectionEnd;
        
        input.value = input.value.substring(0, startPos) + text + input.value.substring(endPos);
        
        // Set cursor position after the inserted text
        input.selectionStart = input.selectionEnd = startPos + text.length;
        input.focus();
    }

    // Function to parse logical expression
    function parseExpression(expression) {
        const variables = new Set();
        const output = [];
        const stack = [];
        
        let i = 0;
        while (i < expression.length) {
            const char = expression[i];
            
            // Skip whitespace
            if (char === ' ') {
                i++;
                continue;
            }
            
            // Handle variables (uppercase letters)
            if (/^[A-Z]$/.test(char)) {
                variables.add(char);
                output.push(char);
                i++;
                continue;
            }
            
            // Handle operators
            if (char in operators) {
                while (
                    stack.length > 0 &&
                    stack[stack.length - 1] !== '(' &&
                    precedence[stack[stack.length - 1]] >= precedence[char]
                ) {
                    output.push(stack.pop());
                }
                stack.push(char);
                i++;
                continue;
            }
            
            // Handle parentheses
            if (char === '(') {
                stack.push(char);
                i++;
                continue;
            }
            
            if (char === ')') {
                while (stack.length > 0 && stack[stack.length - 1] !== '(') {
                    output.push(stack.pop());
                }
                if (stack.length === 0) {
                    throw new Error('Mismatched parentheses');
                }
                stack.pop(); // Remove the '(' from stack
                i++;
                continue;
            }
            
            // Invalid character
            throw new Error(`Invalid character in expression: ${char}`);
        }
        
        // Pop remaining operators from stack
        while (stack.length > 0) {
            const op = stack.pop();
            if (op === '(') {
                throw new Error('Mismatched parentheses');
            }
            output.push(op);
        }
        
        // Sort variables alphabetically
        const sortedVariables = Array.from(variables).sort();
        
        return {
            variables: sortedVariables,
            postfix: output
        };
    }

    // Function to generate all truth value combinations for n variables
    function generateCombinations(n) {
        const combinations = [];
        const count = Math.pow(2, n);
        
        for (let i = 0; i < count; i++) {
            const combination = [];
            for (let j = n - 1; j >= 0; j--) {
                combination.push(Boolean((i >> j) & 1));
            }
            combinations.push(combination);
        }
        
        return combinations;
    }

    // Function to evaluate postfix expression with given variable values
    function evaluateExpression(postfix, variables, values) {
        const stack = [];
        const varValues = {};
        
        // Create variable to value mapping
        variables.forEach((varName, index) => {
            varValues[varName] = values[index];
        });
        
        for (const token of postfix) {
            if (token in operators) {
                // It's an operator
                const op = token;
                if (op === '¬') {
                    // Unary operator
                    if (stack.length < 1) {
                        throw new Error('Invalid expression: not enough operands for operator');
                    }
                    const a = stack.pop();
                    stack.push(operators[op](a));
                } else {
                    // Binary operator
                    if (stack.length < 2) {
                        throw new Error('Invalid expression: not enough operands for operator');
                    }
                    const b = stack.pop();
                    const a = stack.pop();
                    stack.push(operators[op](a, b));
                }
            } else {
                // It's a variable
                stack.push(varValues[token]);
            }
        }
        
        if (stack.length !== 1) {
            throw new Error('Invalid expression');
        }
        
        return {
            result: stack[0]
        };
    }

    // Function to create table header
    function createTableHeader(columns) {
        tableHeader.innerHTML = '';
        
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            tableHeader.appendChild(th);
        });
    }

    // Function to create table row
    function createTableRow(values) {
        const tr = document.createElement('tr');
        
        values.forEach(value => {
            const td = document.createElement('td');
            td.textContent = value ? 'T' : 'F';
            td.className = value ? 'true-value' : 'false-value';
            tr.appendChild(td);
        });
        
        tableBody.appendChild(tr);
    }

    // Function to clear the table
    function clearTable() {
        tableHeader.innerHTML = '';
        tableBody.innerHTML = '';
        hideError();
    }

    // Function to generate truth table
    function generateTruthTable() {
        const expression = expressionInput.value.trim();
        
        if (!expression) {
            showError('Please enter a logical expression');
            updateValidationState(false, 'Expression cannot be empty');
            return;
        }

        try {
            // Parse the expression to validate it
            const parsed = parseExpression(expression);
            
            // Clear previous table
            clearTable();
            
            // Create table header and rows
            const variables = parsed.variables;
            const postfix = parsed.postfix;
            const truthCombinations = generateCombinations(variables.length);
            
            createTableHeader([...variables, expression]);
            
            truthCombinations.forEach(combination => {
                const rowData = evaluateExpression(postfix, variables, combination);
                createTableRow([...combination, rowData.result]);
            });
            
            // Update validation state
            updateValidationState(true, 'Valid expression - table generated');
            hideError();
            
        } catch (error) {
            showError(error.message);
            updateValidationState(false, error.message);
        }
    }

    // Function to copy table to clipboard
    function copyTableToClipboard() {
        if (tableBody.children.length === 0) {
            showNotification('No table to copy');
            return;
        }
        
        let textToCopy = '';
        
        // Add headers
        const headers = Array.from(tableHeader.children).map(th => th.textContent);
        textToCopy += headers.join('\t') + '\n';
        
        // Add rows
        const rows = Array.from(tableBody.children);
        rows.forEach(row => {
            const cells = Array.from(row.children).map(td => td.textContent);
            textToCopy += cells.join('\t') + '\n';
        });
        
        navigator.clipboard.writeText(textToCopy)
            .then(() => showNotification('Table copied to clipboard'))
            .catch(err => showNotification('Failed to copy table'));
    }

    // Function to download table as CSV
    function downloadTableAsCSV() {
        if (tableBody.children.length === 0) {
            showNotification('No table to download');
            return;
        }
        
        let csvContent = '';
        
        // Add headers
        const headers = Array.from(tableHeader.children).map(th => th.textContent);
        csvContent += headers.join(',') + '\n';
        
        // Add rows
        const rows = Array.from(tableBody.children);
        rows.forEach(row => {
            const cells = Array.from(row.children).map(td => td.textContent);
            csvContent += cells.join(',') + '\n';
        });
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'truth_table.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Table downloaded as CSV');
    }

    // Event Listeners

    // Add operator to input when button is clicked
    operatorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const operator = btn.getAttribute('data-operator');
            insertAtCursor(expressionInput, operator);
            expressionInput.focus();
        });
    });

    // Add example expression when button is clicked
    exampleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const example = btn.getAttribute('data-expr');
            expressionInput.value = example;
            expressionInput.focus();
            updateValidationState(isValidExpression(example));
        });
    });

    // Clear input
    clearBtn.addEventListener('click', () => {
        expressionInput.value = '';
        clearTable();
        expressionInput.focus();
        
        // Clear validation state
        const existingMessage = expressionInput.nextElementSibling;
        if (existingMessage && existingMessage.classList.contains('validation-message')) {
            existingMessage.remove();
        }
        expressionInput.classList.remove('input-valid', 'input-invalid');
    });

    // Generate truth table
    generateBtn.addEventListener('click', generateTruthTable);

    // Copy table to clipboard
    copyBtn.addEventListener('click', copyTableToClipboard);

    // Download table as CSV
    downloadBtn.addEventListener('click', downloadTableAsCSV);

    // Allow pressing Enter to generate table
    expressionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            generateTruthTable();
        }
    });

    // Real-time validation as user types
    expressionInput.addEventListener('input', () => {
        const expression = expressionInput.value.trim();
        
        if (!expression) {
            // Clear validation state when empty
            const existingMessage = expressionInput.nextElementSibling;
            if (existingMessage && existingMessage.classList.contains('validation-message')) {
                existingMessage.remove();
            }
            expressionInput.classList.remove('input-valid', 'input-invalid');
            return;
        }
        
        const isValid = isValidExpression(expression);
        updateValidationState(isValid);
    });
});