const knowledgeBase = require('./knowledgeBase');

async function testKnowledgeBase() {
    console.log('=== Testing Knowledge Base System ===\n');

    // Wait for PDF initialization
    console.log('Waiting for PDF initialization...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Give time for PDF to load

    // 1. Test PDF Loading
    console.log('1. Testing PDF Loading:');
    const pdfStatus = knowledgeBase.pdfInfo.getStatus();
    console.log('PDF Status:', pdfStatus);
    console.log('PDF loaded successfully:', pdfStatus.loaded ? 'Yes' : 'No');
    console.log('Number of chunks loaded:', pdfStatus.chunksCount);
    if (pdfStatus.chunksCount > 0) {
        console.log('Sample chunk:', knowledgeBase.pdfInfo.chunks[0].substring(0, 200) + '...');
    }
    console.log('\n');

    // 2. Test Intent-Based Responses
    console.log('2. Testing Intent-Based Responses:');
    const intentTests = [
        { message: 'hi there', intent: 'greeting' },
        { message: 'show me the menu', intent: 'menu' },
        { message: 'i want to order something', intent: 'order' }
    ];

    for (const test of intentTests) {
        console.log(`Testing intent: ${test.intent}`);
        console.log(`Message: "${test.message}"`);
        const response = knowledgeBase.getIntentResponse(test.intent, test.message);
        console.log('Response:', response);
        console.log('\n');
    }

    // 3. Test PDF Content Search
    console.log('3. Testing PDF Content Search:');
    const pdfTests = [
        'What are your policies?',
        'Tell me about your services',
        'How do I contact support?'
    ];

    for (const query of pdfTests) {
        console.log(`Searching for: "${query}"`);
        const results = knowledgeBase.pdfInfo.searchPDFContent(query);
        console.log('Found results:', results.length);
        if (results.length > 0) {
            console.log('First result:', results[0].substring(0, 200) + '...');
        }
        console.log('\n');
    }

    // 4. Test Menu Items and FAQs
    console.log('4. Testing Menu Items and FAQs:');
    
    // Test Menu Items
    console.log('Testing Menu Items:');
    const menuTests = [
        { category: 'hotDrinks', item: 'latte' },
        { category: 'coldDrinks', item: 'frappuccino' },
        { category: 'food', item: 'sandwich' }
    ];

    for (const test of menuTests) {
        console.log(`Testing ${test.category}: ${test.item}`);
        const details = knowledgeBase.getItemDetails(test.category, test.item);
        console.log('Details:', details);
        console.log('\n');
    }

    // Test FAQs
    console.log('Testing FAQs:');
    const faqTests = [
        'What are your opening hours?',
        'Do you have dairy-free options?',
        'What is your return policy?'
    ];

    for (const question of faqTests) {
        console.log(`Testing FAQ: "${question}"`);
        for (const category of ['general', 'menu', 'policies']) {
            const answer = knowledgeBase.getFAQAnswer(category, question);
            if (answer) {
                console.log(`Found in ${category}:`, answer);
            }
        }
        console.log('\n');
    }

    // 5. Test Context-Aware Suggestions
    console.log('5. Testing Context-Aware Suggestions:');
    const contextTests = [
        { message: 'I want to order a latte', category: 'menu' },
        { message: 'What are your prices?', category: 'faq' },
        { message: 'Tell me about your policies', category: 'pdf' }
    ];

    for (const test of contextTests) {
        console.log(`Testing suggestions for: "${test.message}" (${test.category})`);
        const suggestions = knowledgeBase.generateSuggestions({}, test.message, test.category);
        console.log('Suggestions:', suggestions);
        console.log('\n');
    }
}

// Run the tests
testKnowledgeBase().catch(console.error); 