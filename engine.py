from models import DecisionNode, DecisionEdge

class InferenceEngine:
    def get_root_node(self):
        return DecisionNode.query.filter_by(is_root=True).first()
    
    def get_node(self, node_id):
        return DecisionNode.query.get(node_id)
    
    def get_next_options(self, node_id):
        edges = DecisionEdge.query.filter_by(source_id=node_id).all()
        options = []
        for edge in edges:
            options.append({
                'edge_id': edge.id,
                'label': edge.label,
                'target_node_id': edge.target_id
            })
        return options

    def diagnose(self, current_node_id=None):
        if current_node_id is None:
            node = self.get_root_node()
        else:
            node = self.get_node(current_node_id)
            
        if not node:
            return {'error': 'Node not found', 'status': 404}
            
        response = {
            'node_id': node.id,
            'content': node.content,
            'type': node.type, 
            'options': []
        }
        
        if node.type == 'question':
            response['options'] = self.get_next_options(node.id)
            
        return response