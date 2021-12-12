"""
This is where the implementation of the plugin code goes.
The PetriClassifier-class is imported from both run_plugin.py and run_debug.py
"""
import sys
import logging
from webgme_bindings import PluginBase

# Setup a logger
logger = logging.getLogger('PetriClassifier')
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)  # By default it logs to stderr..
handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)


class PetriClassifier(PluginBase):
    def main(self):
        from collections import defaultdict
        active_node = self.active_node
        core = self.core
        logger = self.logger
        META = self.META

        arcs = {}
        transitions = {}
        places = {}
        inplaces = defaultdict(list)
        outplaces = defaultdict(list)
        intransitions = defaultdict(list)
        outtransitions = defaultdict(list)
        
        freechoice = True
        statemachine = True
        markedgraph = True
        workflownet = True

        nodes = core.load_sub_tree(active_node)
        for node in nodes:
            if core.is_instance_of(node, META['Transition']):
                transitions[core.get_path(node)] = node
                inplaces[core.get_path(node)] = []
                outplaces[core.get_path(node)] = []
            elif core.is_instance_of(node, META['Place']):
                places[core.get_path(node)] = node
                intransitions[core.get_path(node)] = []
                outtransitions[core.get_path(node)] = []
            elif core.is_instance_of(node, META['Arc']):
                arcs[core.get_path(node)] = node
        
        for arc in arcs.keys():
            myArc = arcs[arc]
            if(core.get_pointer_path(myArc, 'src') != None and core.get_pointer_path(myArc, 'dst') != None):
                if(core.is_instance_of(myArc, META['PT Arc'])):
                    outtransitions[core.get_pointer_path(myArc, 'src')].append(core.get_pointer_path(myArc, 'dst'))
                    inplaces[core.get_pointer_path(myArc, 'dst')].append(core.get_pointer_path(myArc, 'src'))
                if(core.is_instance_of(myArc, META['TP Arc'])):
                    outplaces[core.get_pointer_path(myArc, 'src')].append(core.get_pointer_path(myArc, 'dst'))
                    intransitions[core.get_pointer_path(myArc, 'dst')].append(core.get_pointer_path(myArc, 'src'))
                
        #logger.info("Done")
        
        

        def intersect(arr1, arr2):
            m = {}
            if len(arr1) < len(arr2):
                arr1, arr2 = arr2, arr1
            for i in arr1:
                if i not in m:
                    m[i] = 1
                else:
                    m[i] += 1
            result = []
            for i in arr2:
                if i in m and m[i] and i not in result:
                    m[i] -= 1
                    result.append(i)
            return result
                
                
        for trans in inplaces:
            for othertrans in inplaces:
                if(len(intersect(inplaces[trans], inplaces[othertrans])) != 0 and trans != othertrans):
                    freechoice = False
        
        for trans in transitions:
            if(len(inplaces[trans]) != 1 or len(outplaces[trans]) != 1):
                statemachine = False
                
        for place in places:
            if(len(intransitions[place]) != 1 or len(outtransitions[place]) != 1):
                markedgraph = False     
        
        source = []
        sink = []

        for place in places:
            if(len(intransitions[place]) == 0):
                source.append(place)
            if(len(outtransitions[place]) == 0):
                sink.append(place)
        
        if(len(source) != 1):
            workflownet = False
        if(len(sink) != 1):
            workflownet = False
        
        if(workflownet):             
            source = source[0]
            sink = sink[0]     

            #Make sure all places are reachable from source

            # Mark all the vertices as not visited
            visited = {}
            for place in places:
                visited[place] = False

            # Create a queue for BFS
            queue = []

            # Mark the source node as
            # visited and enqueue it
            queue.append(source)
            visited[source] = True
            
            while queue:
                i = queue.pop(0)

                for trans in outtransitions[i]:
                    for plc in outplaces[trans]:
                        if(visited[plc] == False):
                            queue.append(plc)
                            visited[plc] = True
            
            for v in visited:
                if(not visited[v]):
                    workflownet = False
            
            #Now make sure all transitions are reachable from source

            # Mark all the vertices as not visited
            visited = {}
            for trans in transitions:
                visited[trans] = False

            # Create a queue for BFS
            queue = []

            # Mark the source node as
            # visited and enqueue it
            for trans in outtransitions[source]:
                queue.append(trans)
                visited[trans] = True
            
            while queue:
                i = queue.pop(0)

                for plc in outplaces[i]:
                    for trans in outtransitions[plc]:
                        if(visited[trans] == False):
                            queue.append(trans)
                            visited[trans] = True
            
            for v in visited:
                if(not visited[v]):
                    workflownet = False

            #Now make sure all places can reach the sink
            #This is equivalent to reverse the outs to ins.
            
            # Mark all the vertices as not visited
            visited = {}
            for place in places:
                visited[place] = False

            # Create a queue for BFS
            queue = []

            # Mark the source node as
            # visited and enqueue it
            queue.append(sink)
            visited[sink] = True
            
            while queue:
                i = queue.pop(0)

                for trans in intransitions[i]:
                    for plc in inplaces[trans]:
                        if(visited[plc] == False):
                            queue.append(plc)
                            visited[plc] = True
            
            for v in visited:
                if(not visited[v]):
                    workflownet = False
            
            #Now make sure all transitions can reach the sink
            #This is equivalent to reverse the outs to ins.

            # Mark all the vertices as not visited
            visited = {}
            for trans in transitions:
                visited[trans] = False

            # Create a queue for BFS
            queue = []

            # Mark the source node as
            # visited and enqueue it
            for trans in intransitions[sink]:
                queue.append(trans)
                visited[trans] = True
            
            while queue:
                i = queue.pop(0)

                for plc in inplaces[i]:
                    for trans in intransitions[plc]:
                        if(visited[trans] == False):
                            queue.append(trans)
                            visited[trans] = True
            
            for v in visited:
                if(not visited[v]):
                    workflownet = False
        
        if(freechoice):
            self.send_notification('Your petri net is a free-choice petri net')
        else:
            self.send_notification('Your petri net is NOT a free-choice petri net')

        if(statemachine):
            self.send_notification('Your petri net is a state machine')
        else:
            self.send_notification('Your petri net is NOT a state machine')

        if(markedgraph):
            self.send_notification('Your petri net is a marked graph')
        else:
            self.send_notification('Your petri net is NOT a marked graph')
        
        if(workflownet):
            self.send_notification('Your petri net is a workflow net')
        else:
            self.send_notification('Your petri net is NOT a workflow net')
