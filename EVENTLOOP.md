结合Promise看JS的事件循环机制(Event Loop):

一、JS是单线程
由于JS是浏览器脚本语言，主要用途是和用户互动以及操作DOM，这决定了它只能是单线程，否则会带来很复杂的同步问题。
JS是单线程，这个线程中只拥有唯一的一个事件循环。

二、任务队列
单线程意味着，所有的任务需要排队，前一个任务结束，才会执行下一个任务。

但是，如果前一个任务耗时很长，后一个任务就不得不一直等待，有时候会遇见这样的问题，很多时候CPU空闲，但是由于IO设备
（输入输出设备）很慢，比如AJAX操作从网络中读取数据，但是这时主线程完全可以不管IO设备，挂起处于等待的任务，先运行
排在后面的任务，等到IO设备返回了结果，再把挂起的任务继续执行。

所以，任务可以分成两种，一种是同步任务，另一种是异步任务。
同步任务指的是，在主线程上排队执行的任务，只有前一个任务执行完毕，才能执行后一个任务；
异步任务指的是，不进入主线程、而进入"任务队列"（task queue）的任务，只有"任务队列"通知主线程，某个异步任务可以执行了，
该任务才会进入主线程执行。

（1）所有同步任务都在主线程上执行，形成一个执行栈（execution context stack）。

（2）主线程之外，还存在一个"任务队列"（task queue）。只要异步任务有了运行结果，就在"任务队列"之中放置一个事件。

（3）一旦"执行栈"中的所有同步任务执行完毕，系统就会读取"任务队列"，看看里面有哪些事件。那些对应的异步任务，于是结束等待状态，进入执行栈，开始执行。

（4）主线程不断重复上面的第三步。

三、关于事件循环和任务队列的规则

* 一个线程中，事件循环是唯一的，但是任务队列可以有多个;
* 任务队列又分为macro-task（宏任务）和micro-task（微任务）;
* macro-task大概包括：script（整体代码）,setTimeout,setInterval,setImmediate,I/O,UI rendering;
* micro-task大概包括：process.nextTick,Promise,Object.observe(已废弃),MutationObserver(html5新特性)
* setTimeout/Promise等我们称之为任务源。而进入任务队列的是他们指定的具体执行任务。
* 来自不同任务源的任务会进入到不同的任务队列
* 事件循环的顺序，决定了JavaScript代码的执行顺序。它从script(整体代码)开始第一次循环。之后全局上下文进入函数调用栈。直到调用栈清空(只剩全局)，
  然后执行所有的micro-task。当所有可执行的micro-task执行完毕之后。循环再次从macro-task开始，找到其中一个任务队列执行完毕，然后再执行所有的micro-task，
  这样一直循环下去。
* 其中每一个任务的执行，无论是macro-task还是micro-task，都是借助函数调用栈来完成


setTimeout作为一个任务分发器，这个函数会立即执行，而它所要分发的任务，也就是它的第一个参数，才是延迟执行

四、结合实例理解JS事件循环机制

```
/**
 * example one
 *
 * 一开始，只有script（整体代码），分发到macro-task队列
 * setTimeout函数：宏任务源，分发到对应的macro-task队列
 * Promise实例：构造函数中的第一个参数是在new时执行的，不会进入其他队列
 *              .then被分发到micro-task的Promise队列中
 *script任务继续往下执行，输出global1，然后，全局任务执行完毕
 *
 * 第一个宏任务script执行完毕之后，就开始执行所有的可执行的微任务
 * 这时候，微任务中，只有Promise队列中的任务then1，执行输出
 *
 * 当所有的微任务执行完毕后，第一轮循环结束，第二轮循环开始，第二轮循环仍然从宏任务macro-task开始
 *
 * 宏任务中，只有在setTimeout队列中还有一个timeout1的任务等待执行。因此就直接执行即可
 *
 * 结果：
 * promise1 =》 promise2 =》 global1 =》 then1 =》 timeout1
 */
setTimeout(function() {
    console.log('timeout1');
});

new Promise(function(resolve) {
    console.log('promise1');
    for(let i = 0; i < 1000; i++) {
        i === 99 && resolve();
    }
    console.log('promise2');
}).then(function() {
    console.log('then1');
});

console.log('global1');
```
```
/**
 * example two
 *
 * 宏任务script首先执行，全局入栈，glob1输出
 * setTimeout：分发到对应的宏任务队列
 * setImmediate：分发到排列在setTimeout后面的宏任务队列
 * process.nextTick: 分发到process.nextTick微任务队列
 * Promise：构造函数直接执行，输出glob1_promise
 *          then分发到Promise相关微任务队列
 * setTimeout（第二个）：分发到setTimeout相关任务队列，排在setTimeout1后面
 * process.nextTick（第二个）：分发到process.nextTick相关微任务队列，排在第一个process.nextTick后面
 * Promise（第二个）：构造函数直接执行，输出glob2_promise
 *                   then分发到Promise相关微任务队列（第一个后面）
 * setImmediate（第二个）：分发到排列在setImmediate（第一个后面）的相关宏任务队列
 *
 * script执行完毕
 *
 * 执行所有的微任务队列中的任务，所有可执行的微任务执行完毕之后，这一轮循环结束
 * 微队列依次输出：process.nextTick微队列：glob1_nextTick =》 glob2_nextTick
 *               Promise微队列：glob1_then =》 glob2_then
 *
 * 微任务执行完毕，循环结束，从宏队列开始
 * 执行setTimeout（先入队），借助函数调用栈来完成，并且遇到任务分发器的时候也会将任务分发到对应的队列中去。
 *
 * setTimeout宏队列（两个任务都要执行，setTimeout1先执行，setTimeout2后执行）：
 * setTimeout（第一个）：执行timeout1
 *                      process.nextTick分发到process.nextTick相关微队列
 *                      Promise构造函数直接执行：timeout1_promise
 *                      then分发到Promise相关微队列
 * setTimeout（第二个）：执行timeout2
 *                      process.nextTick分发到process.nextTick相关微队列
 *                      Promise构造函数直接执行：timeout1_promise
 *                      then分发到Promise相关微队列
 *
 * setTimeout宏队列执行输出顺序：
 *                     函数调用栈输出：timeout1 =》timeout1_promise =》timeout2 =》timeout2_promise
 *                     微队列执行：process.nextTick微队列：timeout1_nextTick =》timeout2_nextTick
 *                                Promise微队列：timeout1_then =》timeout2_then
 *
 * 循环结束，新一轮循环开始
 * setImmediate宏队列（两个任务都要执行，setImmediate1先执行，setImmediate2后执行）：
 * setImmediate（第一个）：执行immediate1
 *                      process.nextTick分发到process.nextTick相关微队列
 *                      Promise构造函数直接执行：immediate1_promise
 *                      then分发到Promise相关微队列
 * setImmediate（第二个）：执行immediate2
 *                      process.nextTick分发到process.nextTick相关微队列
 *                      Promise构造函数直接执行：immediate2_promise
 *                      then分发到Promise相关微队列
 *setImmediate宏队列执行输出顺序：
 *                     函数调用栈输出：immediate1 =》immediate1_promise =》immediate2 =》immediate2_promise
 *                     微队列执行：process.nextTick微队列：immediate1_nextTick =》immediate2_nextTick
 *                                Promise微队列：immediate1_then =》immediate2_then
 *
 * 循环完毕，执行完成
 * 输出结果：
 * golb1 =》glob1_promise =》glob2_promise =》glob1_nextTick =》glob2_nextTick =》glob1_then =》 glob2_then
 * =》timeout1 =》timeout1_promise =》timeout2 =》timeout2_promise =》timeout1_nextTick =》timeout2_nextTick
 * =》timeout1_then =》timeout2_then =》immediate1 =》immediate1_promise =》immediate2 =》immediate2_promise
 * =》immediate1_nextTick =》immediate2_nextTick =》immediate1_then =》immediate2_then
 */

console.log('golb1');

setTimeout(function() {
    console.log('timeout1');
    process.nextTick(function() {
        console.log('timeout1_nextTick');
    });
    new Promise(function(resolve) {
        console.log('timeout1_promise');
        resolve();
    }).then(function() {
        console.log('timeout1_then')
    })
});

setImmediate(function() {
    console.log('immediate1');
    process.nextTick(function() {
        console.log('immediate1_nextTick');
    });
    new Promise(function(resolve) {
        console.log('immediate1_promise');
        resolve();
    }).then(function() {
        console.log('immediate1_then')
    })
});

process.nextTick(function() {
    console.log('glob1_nextTick');
});
new Promise(function(resolve) {
    console.log('glob1_promise');
    resolve();
}).then(function() {
    console.log('glob1_then')
});

setTimeout(function() {
    console.log('timeout2');
    process.nextTick(function() {
        console.log('timeout2_nextTick');
    });
    new Promise(function(resolve) {
        console.log('timeout2_promise');
        resolve();
    }).then(function() {
        console.log('timeout2_then')
    })
});

process.nextTick(function() {
    console.log('glob2_nextTick');
});
new Promise(function(resolve) {
    console.log('glob2_promise');
    resolve();
}).then(function() {
    console.log('glob2_then')
});

setImmediate(function() {
    console.log('immediate2');
    process.nextTick(function() {
        console.log('immediate2_nextTick');
    });
    new Promise(function(resolve) {
        console.log('immediate2_promise');
        resolve();
    }).then(function() {
        console.log('immediate2_then')
    })
});

```