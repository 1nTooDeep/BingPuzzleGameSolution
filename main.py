from copy import deepcopy
import heapq

# 定义目标状态
GOAL = [[1, 2, 3], [4, 5, 6], [7, 8, 0]]

class Puzzle:
    def __init__(self, array: list, depth=0, parent=None, move=None):
        if len(array) == 9:
            self.puzzle = [array[0:3], array[3:6], array[6:9]]
        else:
            self.puzzle = array
        self.depth = depth  # 当前深度
        self.parent = parent  # 父节点
        self.blank_pos = self.find_zero()  # 空白方块的位置
        self.move = move  # 当前移动的方向（'Up', 'Down', 'Left', 'Right'）

    def __lt__(self, other):
        return self.f_cost() < other.f_cost()  # 比较 f_cost 值，返回 True 或 False

    def find_zero(self):
        for i in range(3):
            for j in range(3):
                if self.puzzle[i][j] == 0:
                    return (i, j)
        return None
    
    def is_finish(self):
        return self.puzzle == GOAL
    
    def get_puzzle_str(self):
        return ''.join(str(item) for row in self.puzzle for item in row)

    def move_up(self):
        x, y = self.blank_pos
        if x == 0: return None
        copy = deepcopy(self.puzzle)
        copy[x][y], copy[x-1][y] = copy[x-1][y], copy[x][y]
        return Puzzle(copy, self.depth + 1, self, 'Up')
    
    def move_down(self):
        x, y = self.blank_pos
        if x == 2: return None
        copy = deepcopy(self.puzzle)
        copy[x][y], copy[x+1][y] = copy[x+1][y], copy[x][y]
        return Puzzle(copy, self.depth + 1, self, 'Down')

    def move_left(self):
        x, y = self.blank_pos
        if y == 0: return None
        copy = deepcopy(self.puzzle)
        copy[x][y], copy[x][y-1] = copy[x][y-1], copy[x][y]
        return Puzzle(copy, self.depth + 1, self, 'Left')

    def move_right(self):
        x, y = self.blank_pos
        if y == 2: return None
        copy = deepcopy(self.puzzle)
        copy[x][y], copy[x][y+1] = copy[x][y+1], copy[x][y]
        return Puzzle(copy, self.depth + 1, self, 'Right')
    
    def get_next(self):
        next_puzzles = [self.move_up(), self.move_down(), self.move_left(), self.move_right()]
        return [puzzle for puzzle in next_puzzles if puzzle is not None]

    def calculate_manhattan_distance(self):
        distance = 0
        for i in range(3):
            for j in range(3):
                value = self.puzzle[i][j]
                if value != 0:
                    target_x, target_y = divmod(value, 3)
                    distance += abs(i - target_x) + abs(j - target_y)
        return distance

    def f_cost(self):
        return self.depth + self.calculate_manhattan_distance()




def solve_puzzle(initial_puzzle):
    open_list = []
    closed_list = set()

    # 将初始状态加入 open list
    heapq.heappush(open_list, (initial_puzzle.f_cost(), initial_puzzle))
    
    while open_list:
        _, current = heapq.heappop(open_list)
        
        # 如果当前拼图是目标拼图，返回解法路径
        if current.is_finish():
            path = []
            while current.parent is not None:
                path.append(current.move)  # 添加当前的移动方向
                current = current.parent  # 回溯父节点
            return path[::-1]  # 返回反向路径
        
        # 如果当前拼图已经访问过，跳过
        if current.get_puzzle_str() in closed_list:
            continue
        closed_list.add(current.get_puzzle_str())
        
        # 获取当前拼图的下一步
        for next_puzzle in current.get_next():
            if next_puzzle.get_puzzle_str() not in closed_list:
                heapq.heappush(open_list, (next_puzzle.f_cost(), next_puzzle))
    
    return []  # 如果找不到解


def print_solution(solution_path):
    if solution_path is not None:
        print("Solution found!")
        for step in solution_path:
            for row in step.puzzle:
                print(row)
            print()
    else:
        print("No solution found.")

def handle_input(item:str):
    try:
        value = int(item)
        if value < 9 and value >=0:
            return value
        raise ValueError("输入必须为：0-8之间的数字")
    except:
        raise Exception("输入有误")

if __name__ == "__main__":
    flag = False
    input_arr = []
    print("请输入拼图序号(0-8)，用空格分开：")
    while not flag:
        try:
            input_arr = [handle_input(item) for item in input().split(" ")]
            flag = True
        except:
            continue
    arr = input_arr
    puzzle = Puzzle(arr)
    solution_path = solve_puzzle(puzzle)
    
    print("解法步骤:")
    for step in solution_path:
        print(step)

