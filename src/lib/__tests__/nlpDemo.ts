/**
 * NLP Enhancement Demonstration
 * Shows the capabilities of the enhanced natural language search system
 */

import { 
  extractFromNaturalLanguage,
  extractFromNaturalLanguageWithContext,
  createSearchContext,
  getNLPStats
} from '../naturalLanguageSearch';

/**
 * Demonstrate enhanced NLP capabilities
 */
async function demonstrateEnhancedNLP() {
  console.log('\n🚀 ENHANCED NATURAL LANGUAGE SEARCH DEMONSTRATION\n');
  console.log('=' .repeat(80));

  // Example queries demonstrating different NLP capabilities
  const demoQueries = [
    {
      title: "Sentiment Analysis & Intent Detection",
      query: "I absolutely love calm sandy beaches but hate crowded tourist spots",
      context: createSearchContext({
        userPreferences: ['peaceful', 'natural'],
        timeOfDay: 'morning'
      })
    },
    {
      title: "Complex Entity Recognition",
      query: "Show me the best family-friendly beaches with lifeguards, sunbeds, and traditional Greek tavernas in Crete",
      context: createSearchContext({
        userPreferences: ['family-friendly', 'authentic'],
        season: 'summer'
      })
    },
    {
      title: "Question Processing & Recommendations",
      query: "What are the most beautiful beaches for Instagram photos with amazing snorkeling opportunities?",
      context: createSearchContext({
        userPreferences: ['photography', 'water activities']
      })
    },
    {
      title: "Negative Preferences & Contrasts",
      query: "I want pebbly beaches with calm waters but without loud music or beach bars",
      context: createSearchContext({
        userPreferences: ['quiet', 'natural']
      })
    },
    {
      title: "Accessibility & Special Needs",
      query: "Find beaches with wheelchair access, medical facilities, and shallow waters for elderly visitors",
      context: createSearchContext({
        userPreferences: ['accessible', 'safe']
      })
    }
  ];

  for (const demo of demoQueries) {
    console.log(`\n📋 ${demo.title}`);
    console.log(`Query: "${demo.query}"`);
    console.log('-'.repeat(60));

    try {
      // Process with enhanced NLP
      const startTime = Date.now();
      const result = await extractFromNaturalLanguageWithContext(demo.query, demo.context);
      const processingTime = Date.now() - startTime;

      // Display results
      console.log(`\n🎯 EXTRACTION RESULTS:`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   Processing Time: ${processingTime}ms`);
      
      if (result.place) {
        console.log(`   📍 Place: ${result.place}`);
      }
      
      if (result.filters.type && result.filters.type.length > 0) {
        console.log(`   🏖️  Beach Types: ${result.filters.type.join(', ')}`);
      }
      
      if (result.filters.waveConditions && result.filters.waveConditions.length > 0) {
        console.log(`   🌊 Wave Conditions: ${result.filters.waveConditions.join(', ')}`);
      }
      
      if (result.filters.amenities && result.filters.amenities.length > 0) {
        console.log(`   🏪 Amenities: ${result.filters.amenities.join(', ')}`);
      }
      
      if (result.filters.parking && result.filters.parking.length > 0) {
        console.log(`   🅿️  Parking: ${result.filters.parking.join(', ')}`);
      }
      
      if (result.filters.organized && result.filters.organized.length > 0) {
        console.log(`   🏢 Organization: ${result.filters.organized.join(', ')}`);
      }
      
      if (result.filters.blueFlag) {
        console.log(`   🏆 Blue Flag Certified`);
      }

      console.log(`\n🧠 NLP ANALYSIS:`);
      console.log(`   Sentiment: ${result.sentiment.polarity} (${(result.sentiment.confidence * 100).toFixed(1)}% confidence)`);
      console.log(`   Intent: ${result.intent.primaryIntent} (${(result.intent.confidence * 100).toFixed(1)}% confidence)`);
      console.log(`   Intensity: ${result.sentiment.intensity}`);
      
      if (result.sentiment.keywords.length > 0) {
        console.log(`   Keywords: ${result.sentiment.keywords.join(', ')}`);
      }
      
      if (result.intent.modifiers.length > 0) {
        console.log(`   Modifiers: ${result.intent.modifiers.join(', ')}`);
      }

      console.log(`\n🏷️  ENTITY RECOGNITION:`);
      console.log(`   Total Entities: ${result.entities.all.length}`);
      
      if (result.entities.places.length > 0) {
        console.log(`   Places: ${result.entities.places.map(p => p.text).join(', ')}`);
      }
      
      if (result.entities.amenities.length > 0) {
        console.log(`   Amenities: ${result.entities.amenities.map(a => a.text).join(', ')}`);
      }
      
      if (result.entities.beachTypes.length > 0) {
        console.log(`   Beach Types: ${result.entities.beachTypes.map(b => b.text).join(', ')}`);
      }
      
      if (result.entities.waveConditions.length > 0) {
        console.log(`   Wave Conditions: ${result.entities.waveConditions.map(w => w.text).join(', ')}`);
      }

      if (result.suggestions && result.suggestions.length > 0) {
        console.log(`\n💡 SUGGESTIONS:`);
        result.suggestions.forEach((suggestion, index) => {
          console.log(`   ${index + 1}. ${suggestion}`);
        });
      }

      console.log(`\n🔍 CLEANED SEARCH TERM: "${result.cleanedSearchTerm}"`);

    } catch (error) {
      console.log(`❌ Error processing query: ${error}`);
    }
  }

  // Demonstrate hybrid functionality
  console.log(`\n\n🔄 HYBRID FUNCTIONALITY DEMONSTRATION`);
  console.log('=' .repeat(80));

  const hybridQueries = [
    "sandy beaches",
    "I want the most amazing beaches with incredible snorkeling and family-friendly amenities in Crete"
  ];

  // Show NLP statistics
  console.log(`\n\n📊 NLP SYSTEM STATISTICS`);
  console.log('=' .repeat(80));
  
  const stats = getNLPStats();
  console.log('Text Processor Cache:', stats.textProcessor);
  console.log('Entity Recognizer:', stats.entityRecognizer);
  console.log('Fuzzy Matcher:', stats.fuzzyMatcher);

  console.log('\n✅ Demonstration completed!\n');
}

// Performance comparison
async function performanceComparison() {
  console.log('\n⚡ PERFORMANCE COMPARISON\n');
  console.log('=' .repeat(80));

  const testQueries = [
    "sandy beaches",
    "calm beaches with parking",
    "I want the most amazing family-friendly beaches with lifeguards and traditional tavernas in Crete",
    "What are the best beaches for Instagram photos with amazing snorkeling opportunities and blue flag certification?"
  ];

  for (const query of testQueries) {
    console.log(`\nQuery: "${query}"`);
    
    // Test original implementation
    const originalStart = Date.now();
    const { extractFromNaturalLanguage } = await import('../naturalLanguageSearch');
    const originalResult = await extractFromNaturalLanguage(query);
    const originalTime = Date.now() - originalStart;
    
    // Test enhanced implementation
    const enhancedStart = Date.now();
    const enhancedResult = await extractFromNaturalLanguage(query);
    const enhancedTime = Date.now() - enhancedStart;
    
    console.log(`   Original: ${originalTime}ms`);
    console.log(`   Enhanced: ${enhancedTime}ms`);
    console.log(`   Overhead: ${enhancedTime - originalTime}ms (${((enhancedTime - originalTime) / originalTime * 100).toFixed(1)}%)`);
    console.log(`   Features: ${enhancedResult.entities.all.length} entities, ${enhancedResult.sentiment.polarity} sentiment`);
  }
}

// Run demonstrations
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateEnhancedNLP()
    .then(() => performanceComparison())
    .then(() => {
      console.log('🎉 All demonstrations completed successfully!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Demonstration failed:', error);
      process.exit(1);
    });
}

export { demonstrateEnhancedNLP, performanceComparison };
