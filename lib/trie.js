"use strict"

/**
 * Trie implementation in JavaScript
 */

var TrieNode = function(){
  // # of words end here 
  this.wordsCount = 0
  // # of words will match the prefix
  this.prefixMatches = 0
  // all the node belong to this node
  this.children = {}
}

var Trie = function(){
  this.root = new TrieNode()
}

Trie.prototype.insert = function(word){
  // if not a word, return
  if(word.length <=0) return
  var node = this.root
  var i = 0
  // loop every character of the word and update associate node
  while(i<word.length){
    if(!node.children.hasOwnProperty(word[i])){
      node.children[word[i]] = new TrieNode()
    }
    node = node.children[word[i]] 
    if(i == word.length-1){
      node.wordsCount ++
    }else{
      node.prefixMatches ++
    }
    i ++
  }
}


Trie.prototype.remove = function(word){
  // if not a word, return
  if(word.length <=0) return
  var node = this.root
  var i = 0
  // loop every character of the word and update associate node
  while(i<word.length){
    if(!node.children.hasOwnProperty(word[i])){
      return "This word is not in Trie"
    }
    node = node.children[word[i]] 
    if(i == word.length-1){
      if(node.wordsCount){
        node.wordsCount --
      }else{
        console.log("This word is not in Trie")
        return
      }
    }else{
      node.prefixMatches --
    }
    i ++
  }
} 

Trie.prototype.search = function(word){
  // if not a word, return
  if(word.length <=0) return false
  var node = this.root
  var i = 0
  // loop every character of the word and find whether there is any match
  while(i<word.length){
    if(!node.children.hasOwnProperty(word[i])){
      return false
    }
    node = node.children[word[i]] 
    if(i == word.length-1 && node.wordsCount === 0){
      return false
    }
    i ++
  }
  return true
}

Trie.prototype.startsWith = function(prefix){
  // if not a word, return
  if(prefix.length <=0) return false
  var node = this.root
  var i = 0
  // loop every character of the word and find whether there is any match
  while(i<prefix.length){
    if(!node.children.hasOwnProperty(prefix[i])){
      return false
    }
    node = node.children[prefix[i]] 
    if(i == prefix.length-1 && (node.prefixMatches !== 0 || node.wordsCount !== 0)){
      return true
    }
    i ++
  }
  return false
} 


Trie.prototype.autocomplete = function(prefix){
   // if not a word, return
  if(prefix.length <=0) return false
  var node = this.root,
    i = 0,
    output = []
  // loop every character of the word and find whether there is any match
  while(i<prefix.length){
    if(!node.children.hasOwnProperty(prefix[i])){
      return false
    }
    node = node.children[prefix[i]] 
    if(i == prefix.length-1 && (node.prefixMatches !== 0 || node.wordsCount !== 0)){
      return this.bfs(node,prefix,output)
    }
    i ++
  }
  return false
} 


Trie.prototype.getWords = function(node,prefix,output){
  if(node === null) return
  if(node.wordsCount>0){
    output.push(prefix)
  }
  var i = 0
  for(var j in node.children){
    this.getWords(node.children[j],prefix+j,output)
  }
  return output
}

Trie.prototype.bfs = function(node,prefix,output){
  if(node === null) return
  if(node.wordsCount>0){
    output.push(prefix)
  }
  var queue = [node]
  var queueP = [prefix]
  while(queue.length>0){
    var temp = queue.shift()
    prefix = queueP.shift()
    for(var i in temp.children){
      if(temp.children[i].wordsCount>0){
        output.push(prefix+i)
      }
      queue.push(temp.children[i])
      queueP.push(prefix+i)
    }
  }
  //var i = 0
  //for(var j in node.children){
  //  
  //  this.getWords(node.children[j],prefix+j,output)
  //}
  return output
}

Trie.prototype.searchNode = function(node,str){
  var i = 0
  while(i<str.length){
    if(str[i] == "." && i == str.length - 1){
      for(var j in node.children){
        if(node.children[j].wordsCount !== 0){
          return true
        }
      }  
    }else if(str[i] == "."){
      for(var z in node.children){
        if(this.searchNode(node.children[z],str.slice(i+1))){
          return true
        }
      }
      break
    }else{
      if(!node.children.hasOwnProperty(str[i])){
        return false
      }
      node = node.children[str[i]]
      if(i == str.length -1 && node.wordsCount !== 0){
        return true
      }
    }
    i ++
  }
  return false
}


Trie.prototype.test = function(){
  var kk = new Trie()
  kk.insert("been")
  kk.insert("beep")
  kk.insert("bees")
  kk.insert("bee")
  kk.insert("beef")
  kk.insert("beach")
  kk.insert("beatles")
  console.log(kk.autocomplete("bea"))
}

module.exports = Trie;
