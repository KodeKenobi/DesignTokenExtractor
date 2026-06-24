// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: jest.fn((msg, callback) => {
      if (callback) callback({ success: true });
    }),
    lastError: null
  },
  scripting: {
    executeScript: jest.fn((options, callback) => {
      if (callback) callback();
    })
  }
};

// Mock Image constructor
global.Image = class {
  constructor() {
    this.width = 0;
    this.height = 0;
  }
  set src(value) {
    // Simulate image load
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
};
