// A small, dependency-free ridge (L2-regularized) linear regression.
// Used to fit y = w0 + w1*x1 + w2*x2 + ... from historical data collected
// inside the app itself (e.g. this organization's own past rides), and to
// predict for new inputs. Ridge regularization keeps it stable even with
// very little training data (important for a fresh org with few rides).
class RidgeRegression {
  constructor(lambda = 1.0) {
    this.lambda = lambda;
    this.weights = null; // includes bias as weights[0]
  }

  static addBias(X) {
    return X.map((row) => [1, ...row]);
  }

  static multiply(A, B) {
    const rowsA = A.length, colsA = A[0].length, colsB = B[0].length;
    const result = Array.from({ length: rowsA }, () => new Array(colsB).fill(0));
    for (let i = 0; i < rowsA; i++) {
      for (let j = 0; j < colsB; j++) {
        let sum = 0;
        for (let k = 0; k < colsA; k++) sum += A[i][k] * B[k][j];
        result[i][j] = sum;
      }
    }
    return result;
  }

  static transpose(A) {
    return A[0].map((_, j) => A.map((row) => row[j]));
  }

  // Gauss-Jordan matrix inverse (fine for the tiny feature counts we use here)
  static invert(M) {
    const n = M.length;
    const A = M.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
    for (let i = 0; i < n; i++) {
      let pivot = A[i][i];
      if (Math.abs(pivot) < 1e-10) {
        const swapRow = A.slice(i + 1).findIndex((r) => Math.abs(r[i]) > 1e-10);
        if (swapRow === -1) throw new Error('Matrix not invertible');
        [A[i], A[i + swapRow + 1]] = [A[i + swapRow + 1], A[i]];
        pivot = A[i][i];
      }
      for (let j = 0; j < 2 * n; j++) A[i][j] /= pivot;
      for (let k = 0; k < n; k++) {
        if (k === i) continue;
        const factor = A[k][i];
        for (let j = 0; j < 2 * n; j++) A[k][j] -= factor * A[i][j];
      }
    }
    return A.map((row) => row.slice(n));
  }

  // X: array of feature arrays (without bias), y: array of numbers
  fit(X, y) {
    const Xb = RidgeRegression.addBias(X);
    const XT = RidgeRegression.transpose(Xb);
    const XTX = RidgeRegression.multiply(XT, Xb);
    const n = XTX.length;
    for (let i = 1; i < n; i++) XTX[i][i] += this.lambda; // don't regularize bias term
    const XTXinv = RidgeRegression.invert(XTX);
    const yMat = y.map((v) => [v]);
    const XTy = RidgeRegression.multiply(XT, yMat);
    const w = RidgeRegression.multiply(XTXinv, XTy);
    this.weights = w.map((row) => row[0]);
    return this;
  }

  predict(features) {
    if (!this.weights) throw new Error('Model not trained');
    return this.weights[0] + features.reduce((sum, f, i) => sum + f * this.weights[i + 1], 0);
  }
}

module.exports = RidgeRegression;
