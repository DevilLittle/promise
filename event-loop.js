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
